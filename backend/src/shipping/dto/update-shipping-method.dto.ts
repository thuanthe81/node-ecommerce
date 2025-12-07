import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateShippingMethodDto } from './create-shipping-method.dto';

// Omit methodId from updates as it should be immutable
export class UpdateShippingMethodDto extends PartialType(
  OmitType(CreateShippingMethodDto, ['methodId'] as const),
) {}
