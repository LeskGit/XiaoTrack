import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";


export class RegisterDto {

    @Transform(({ value }) =>  typeof value === "string" ? value.trim().toLowerCase() : value,)
    @IsEmail()
    email!: string;

    @Transform(({ value }) => typeof value === "string" ? value.trim().normalize("NFC") : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    // Letters (accents included), digits, "_" and "-" only: no space, no @, no #
    @Matches(/^[\p{L}\p{N}_-]+$/u)
    displayName!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}