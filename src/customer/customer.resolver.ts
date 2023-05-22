import { Args, Query, Resolver, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { Customer } from 'lib/entities/customer.entity';
import { Auth } from 'lib/entities/auth.entity';
import { Token } from 'lib/entities/token.entity';
import { GqlAuthGuard } from '../auth/guard/gql-auth.guard';

import { CustomerService } from './customer.service';

import { GetCustomerInput, CreateCustomerInput } from './dto/customer.input';

import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CreateCustomerMutationResponse {
  @Field(() => String)
  activationCode: string;
}

@Resolver(() => Customer)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Mutation(() => CreateCustomerMutationResponse)
  async createCustomer(@Args('data') data: CreateCustomerInput) {
    return this.customerService.createCustomer(data);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Customer])
  async customers(@Args('data') { skip, take, where }: GetCustomerInput) {
    return this.customerService.findAll({ skip, take, where });
  }
}
