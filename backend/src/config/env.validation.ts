import { plainToInstance } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, validateSync } from "class-validator";

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsString()
  @IsOptional()
  PAYHERE_MERCHANT_ID?: string;

  @IsString()
  @IsOptional()
  PAYHERE_MERCHANT_SECRET?: string;

  @IsString()
  @IsOptional()
  PAYHERE_CURRENCY?: string;

  @IsString()
  @IsOptional()
  PAYHERE_SANDBOX?: string;

  @IsString()
  @IsOptional()
  PAYHERE_USD_TO_LKR_RATE?: string;

  @IsString()
  @IsOptional()
  BACKEND_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  PORT?: string;

  @IsString()
  @IsOptional()
  ADMIN_EMAIL?: string;

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  ADMIN_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((e) => Object.values(e.constraints || {}).join(", "))
        .join("\n")}`
    );
  }

  const hasStripe = Boolean(validated.STRIPE_SECRET_KEY);
  const hasPayHere = Boolean(validated.PAYHERE_MERCHANT_ID && validated.PAYHERE_MERCHANT_SECRET);

  if (!hasStripe && !hasPayHere) {
    throw new Error("At least one payment provider must be configured (Stripe or PayHere)");
  }

  return validated;
}
