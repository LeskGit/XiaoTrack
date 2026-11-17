import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";


export class LoginDto {
    @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @MaxLength(128)
    @IsString()
    password!: string;
}