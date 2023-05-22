import { ObjectType } from '@nestjs/graphql';
import { Customer } from './customer.entity';
import { Token } from './token.entity';

@ObjectType()
export class Auth extends Token {
  customer: Customer;
}
