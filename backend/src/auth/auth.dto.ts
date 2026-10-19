import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @Length(3, 254, { message: 'Informe seu e-mail ou usuário.' })
  username!: string;

  @IsString()
  @Length(1, 128, { message: 'Informe sua senha.' })
  password!: string;
}

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @Length(3, 254)
  email!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 100, { message: 'O nome deve ter entre 1 e 100 caracteres.' })
  name!: string;

  @IsString()
  @Length(12, 128, { message: 'Use uma senha de 12 a 128 caracteres.' })
  @Matches(/[A-Z]/, { message: 'Inclua pelo menos uma letra maiúscula.' })
  @Matches(/[0-9]/, { message: 'Inclua pelo menos um número.' })
  @Matches(/[^\p{L}\p{N}\s]/u, { message: 'Inclua pelo menos um símbolo, como !, @ ou #.' })
  password!: string;
}
