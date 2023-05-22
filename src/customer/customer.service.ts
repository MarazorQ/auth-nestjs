import { Injectable, ConflictException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from 'src/prisma.service';
import { GetCustomerInput, CreateCustomerInput } from './dto/customer.input';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(data: CreateCustomerInput) {
    const { email, password } = data;

    const isEmailAlreadyExist = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (isEmailAlreadyExist) throw new ConflictException();

    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, passwordSalt);

    const activationCode = uuidv4();

    await this.prisma.customer.create({
      data: {
        email,
        password: passwordHash,
        activationCode,
      },
    });

    // p.s. in real applications - this will be sent to the mail
    return { activationCode };
  }

  async findAll(params: GetCustomerInput) {
    const { skip, take, cursor, where } = params;

    return this.prisma.customer.findMany({
      skip,
      take,
      cursor,
      where,
    });
  }
}
