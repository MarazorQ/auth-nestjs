import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CustomerStatus } from '@prisma/client';
import { Base } from 'lib/entities/base.entity';

registerEnumType(CustomerStatus, {
  name: 'CustomerStatus',
});

@ObjectType()
export class Customer extends Base {
  @Field(() => String)
  email: string;

  @Field(() => CustomerStatus)
  status?: CustomerStatus;

  @Field(() => String)
  activationCode: string;
}
