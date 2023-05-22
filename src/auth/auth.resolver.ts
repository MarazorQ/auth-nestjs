import { Args, Resolver, Mutation, Context } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { Auth } from 'lib/entities/auth.entity';
import { Token } from 'lib/entities/token.entity';
import { ILoginResponse, IAuthResponse } from './auth.service';
import { GqlAuthGuard } from './guard/gql-auth.guard';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/auth.input';

@ObjectType()
class ActivateMutationResponse {
  @Field(() => Boolean)
  success: boolean;
}
@ObjectType()
class LogoutMigrationResponse extends ActivateMutationResponse {}

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Auth)
  async login(@Args('data') data: LoginInput, @Context('req') req: Request) {
    const { refreshToken, accessToken, customer }: ILoginResponse =
      await this.authService.login(data);

    //7d
    req.res?.cookie('token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      refreshToken,
      accessToken,
      customer,
    };
  }

  @Mutation(() => Token)
  async auth(
    @Args('customerId') customerId: string,
    @Context('req') req: Request,
  ) {
    const { token } = req.cookies;
    const { accessToken, refreshToken }: IAuthResponse =
      await this.authService.auth(customerId, token);

    //7d
    req.res?.cookie('token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => LogoutMigrationResponse)
  async logout(
    @Args('customerId') customerId: string,
    @Context('req') req: Request,
  ) {
    req.res.clearCookie('token');
    return this.authService.logout(customerId);
  }

  @Mutation(() => ActivateMutationResponse)
  async activate(@Args('activationCode') activationCode: string) {
    return this.authService.activate(activationCode);
  }
}
