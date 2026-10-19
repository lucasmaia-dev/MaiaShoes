import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @Matches(/^[a-z0-9_.-]{3,32}$/, { message: 'Use um usuário de 3 a 32 letras, números, pontos, traços ou sublinhados.' })
  username!: string;

  @IsString()
  @Length(1, 128, { message: 'Informe sua senha.' })
  password!: string;
}

export class RegisterDto extends LoginDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 100, { message: 'O nome deve ter entre 1 e 100 caracteres.' })
  name!: string;

  @Length(12, 128, { message: 'Use uma senha de 12 a 128 caracteres.' })
  @Matches(/\S/, { message: 'A senha não pode conter apenas espaços.' })
  declare password: string;
}
