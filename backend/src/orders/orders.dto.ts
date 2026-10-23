import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsInt() @Min(1) productId: number;
  @IsInt() @Min(1) @Max(10) quantity: number;
  @IsOptional() @IsIn(['FEMININO', 'MASCULINO']) line?: string;
  @IsOptional() @IsInt() @Min(34) @Max(43) size?: number;
}

export class CreateCartOrderDto {
  @IsUUID() requestId: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
  @IsString() @Matches(/^\+?[\d ()-]{10,30}$/) contact: string;
  @IsIn(['RETIRADA', 'ENTREGA']) fulfillment: 'RETIRADA' | 'ENTREGA';
}

export class CreateOrderDto {
  @IsUUID() requestId: string;
  @IsInt() @Min(1) productId: number;
  @IsInt() @Min(1) @Max(10) quantity: number;
  @IsOptional() @IsIn(['FEMININO', 'MASCULINO']) line?: string;
  @IsOptional() @IsInt() @Min(34) @Max(43) size?: number;
  @IsString() @Matches(/^\+?[\d ()-]{10,30}$/) contact: string;
  @IsIn(['RETIRADA', 'ENTREGA']) fulfillment: 'RETIRADA' | 'ENTREGA';
  @IsOptional() @IsString() @MaxLength(500) address?: string;
}

export class ChooseFulfillmentDto {
  @IsIn(['RETIRADA', 'ENTREGA']) fulfillment: 'RETIRADA' | 'ENTREGA';
}

export class ApproveOrderDto {
  @IsInt() @Min(0) @Max(100000) shippingCents: number;
}

export class ConfirmPaymentDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9-]+$/)
  bankReference: string;
}

export class UpdateOrderProgressDto {
  @IsIn(['PREPARANDO', 'SAIU_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA'])
  expectedStatus: 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'PRONTO_PARA_RETIRADA';
  @IsIn(['SAIU_PARA_ENTREGA', 'PRONTO_PARA_RETIRADA', 'CONCLUIDO'])
  status: 'SAIU_PARA_ENTREGA' | 'PRONTO_PARA_RETIRADA' | 'CONCLUIDO';
}
