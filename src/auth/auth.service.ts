import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma.service';
import { CustomerStatus } from '@prisma/client';
import { LoginInput } from './dto/auth.input';

export interface ILoginResponse {
  refreshToken: string;
  accessToken: string;
  customer: {
    id: string;
    email: string;
    status: string;
    activationCode: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
export interface IAuthResponse extends Omit<ILoginResponse, 'customer'> {}
interface IJwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async generateTokens(
    customerId: string,
    email: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const jwtPayload: IJwtPayload = {
      sub: customerId,
      email: email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: {
        token: true,
      },
    });

    if (!customer) throw new NotFoundException();

    if (customer.status === CustomerStatus.INVITED)
      throw new BadRequestException('Account not activated');

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid)
      throw new BadRequestException('Invalid login or password');

    const { refreshToken, accessToken } = await this.generateTokens(
      customer.id,
      customer.email,
    );

    if (customer?.token?.refreshToken)
      await this.prisma.token.update({
        where: {
          id: customer.token.id,
        },
        data: {
          refreshToken,
        },
      });
    else
      await this.prisma.token.create({
        data: {
          refreshToken,
          customerId: customer.id,
        },
      });

    return {
      refreshToken,
      accessToken,
      customer,
    };
  }

  async activate(activationCode: string) {
    const isActivationCodeExist = await this.prisma.customer.findFirst({
      where: { activationCode },
    });

    if (!isActivationCodeExist) throw new NotFoundException();

    await this.prisma.customer.update({
      where: {
        email: isActivationCodeExist.email,
      },
      data: {
        activationCode: '',
        status: CustomerStatus.ACTIVE,
      },
    });

    return { success: true };
  }

  async logout(customerId: string) {
    await this.prisma.token.deleteMany({
      where: {
        customerId,
      },
    });
    return { success: true };
  }

  async auth(customerId: string, refreshToken: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { token: true },
      });

      if (!customer || !customer.token) throw new UnauthorizedException();
      if (customer.token.refreshToken !== refreshToken)
        throw new UnauthorizedException();

      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      return this.generateTokens(customer.id, customer.email);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
