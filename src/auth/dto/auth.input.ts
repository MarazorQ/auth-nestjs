import {  InputType } from '@nestjs/graphql';
import { CreateCustomerInput } from '../../customer/dto/customer.input';

@InputType()
export class LoginInput extends CreateCustomerInput {}
