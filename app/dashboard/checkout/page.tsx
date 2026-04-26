"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Route,
  Search,
  Trash,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import z from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import MainLayout from "@/layout/main-layout";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map";

interface SearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface RouteInfo {
  coordinates: [number, number][];
  distance: number; // meter
  duration: number; // detik
}

interface Suggestion {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

const CENTER_POINT = {
  lng: 114.15228928828692,
  lat: -8.366400812635693,
  name: "Bengkel MW Marchaban",
};
const MAX_DISTANCE_KM = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} menit`;
  return `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
}

function MapFlyController({
  target,
}: {
  target: { lng: number; lat: number; zoom: number } | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !target) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: target.zoom,
      duration: 1800,
      essential: true,
    });
  }, [map, isLoaded, target]);

  return null;
}

interface ProductPrice {
  regular: number;
  sale?: number;
  currency: string;
}

type CartItem = {
  product_id: string;
  link: string;
  name: string;
  image: string;
  price: ProductPrice;
  quantity: number;
  details: {
    label: string;
    value: string;
  }[];
};

interface CartItemProps extends CartItem {
  index: number;
  onRemoveClick: () => void;
  onQuantityChange: (newQty: number) => void;
}

interface CartProps {
  cartItems: CartItem[];
  form: UseFormReturn<CheckoutFormType>;
}

const PAYMENT_METHODS = {
  creditCard: "creditCard",
  paypal: "paypal",
  onlineBankTransfer: "onlineBankTransfer",
};

type PaymentMethod = keyof typeof PAYMENT_METHODS;

const CreditCardPayment = z.object({
  method: z.literal(PAYMENT_METHODS.creditCard),
  cardholderName: z.string(),
  cardNumber: z.string(),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid format (MM/YY)")
    .refine((value) => {
      const [mm, yy] = value.split("/").map(Number);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear() % 100;

      if (yy < currentYear) return false;

      if (yy === currentYear && mm < currentMonth) return false;

      return true;
    }, "Card has expired"),
  cvc: z.string(),
});

const PayPalPayment = z.object({
  method: z.literal(PAYMENT_METHODS.paypal),
  payPalEmail: z.string(),
});

const BankTransferPayment = z.object({
  method: z.literal(PAYMENT_METHODS.onlineBankTransfer),
  bankName: z.string(),
  accountNumber: z.string(),
});

const PaymentSchema = z.discriminatedUnion("method", [
  CreditCardPayment,
  PayPalPayment,
  BankTransferPayment,
]);

const checkoutFormSchema = z.object({
  contactInfo: z.object({
    email: z.string(),
    subscribe: z.boolean().optional(),
  }),
  address: z.object({
    country: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    address: z.string(),
    postalCode: z.string(),
    city: z.string(),
    phone: z.string(),
  }),
  shippingMethod: z.string(),
  payment: PaymentSchema,
  products: z
    .object({
      product_id: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
    .array(),
});

type CheckoutFormType = z.infer<typeof checkoutFormSchema>;

const CART_ITEMS: CartItem[] = [
  {
    product_id: "product-1",
    link: "#",
    name: "Stylish Maroon Sneaker",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/stylish-maroon-sneaker.png",
    price: {
      regular: 354.0,
      currency: "USD",
    },
    quantity: 1,
    details: [
      {
        label: "Color",
        value: "Red",
      },
      {
        label: "Size",
        value: "36",
      },
    ],
  },
  {
    product_id: "product-2",
    link: "#",
    name: "Bicolor Sweatshirt with Embroidered Logo",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/bicolor-crewneck-sweatshirt-with-embroidered-logo.png",
    price: {
      regular: 499.0,
      currency: "USD",
    },
    quantity: 1,
    details: [
      {
        label: "Color",
        value: "Blue & White",
      },
      {
        label: "Size",
        value: "L",
      },
    ],
  },
  {
    product_id: "product-4",
    link: "#",
    name: "Maroon Leather Handbag",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/maroon-leather-handbag.png",
    price: {
      regular: 245.0,
      currency: "USD",
    },
    quantity: 1,
    details: [
      {
        label: "Color",
        value: "Maroon",
      },
    ],
  },
];

interface Checkout1Props {
  cartItems?: CartItem[];
  className?: string;
}

const ContactFields = () => {
  const form = useFormContext();

  return (
    <FieldGroup className="gap-3.5">
      <Controller
        name="contactInfo.email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              className="text-sm font-normal"
              htmlFor="checkout-email"
            >
              Email
            </FieldLabel>
            <Input
              {...field}
              id="checkout-email"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="contactInfo.subscribe"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="checkout-subscribe"
              name={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor="checkout-subscribe" className="font-normal">
              Email me with news and offers
            </FieldLabel>
          </Field>
        )}
      />
    </FieldGroup>
  );
};

const AddressFields = () => {
  const form = useFormContext();

  return (
    <FieldGroup className="gap-3.5">
      <Controller
        name="address.country"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              className="text-sm font-normal"
              htmlFor="checkout-country"
            >
              Country
            </FieldLabel>
            <Input
              {...field}
              id="checkout-country"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex gap-3.5 max-sm:flex-col">
        <Controller
          name="address.firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className="text-sm font-normal"
                htmlFor="checkout-firstName"
              >
                First Name
              </FieldLabel>
              <Input
                {...field}
                id="checkout-firstName"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className="text-sm font-normal"
                htmlFor="checkout-lastName"
              >
                Last Name
              </FieldLabel>
              <Input
                {...field}
                id="checkout-lastName"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="address.address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              className="text-sm font-normal"
              htmlFor="checkout-address"
            >
              Address
            </FieldLabel>
            <Input
              {...field}
              id="checkout-address"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex gap-3.5 max-sm:flex-col">
        <Controller
          name="address.postalCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className="text-sm font-normal"
                htmlFor="checkout-postalCode"
              >
                Postal Code
              </FieldLabel>
              <Input
                {...field}
                id="checkout-postalCode"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.city"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className="text-sm font-normal"
                htmlFor="checkout-city"
              >
                City
              </FieldLabel>
              <Input
                {...field}
                id="checkout-city"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="address.phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel
              className="text-sm font-normal"
              htmlFor="checkout-phone"
            >
              Phone
            </FieldLabel>
            <Input
              {...field}
              id="checkout-phone"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
};

const ShippingMethodFields = () => {
  const form = useFormContext();

  return (
    <Controller
      name="shippingMethod"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            className="flex max-sm:flex-col"
          >
            <FieldLabel htmlFor="checkout-shippingMethod-1">
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldTitle>UPS</FieldTitle>
                  <FieldDescription>Delivery: Tomorrow</FieldDescription>
                </FieldContent>
                <div className="flex gap-3.5">
                  <p className="text-sm">$10.00</p>
                  <RadioGroupItem
                    value="UPS"
                    id="checkout-shippingMethod-1"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="checkout-shippingMethod-2">
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldTitle>FedEx</FieldTitle>
                  <FieldDescription>Delivery: Next Week</FieldDescription>
                </FieldContent>
                <div className="flex gap-3.5">
                  <p className="text-sm">$2.99</p>
                  <RadioGroupItem
                    value="FedEx"
                    id="checkout-shippingMethod-2"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
              </Field>
            </FieldLabel>
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const PaymentFields = () => {
  const form = useFormContext();
  const paymentMethod = form.watch("payment.method") as PaymentMethod;

  return (
    <div className="space-y-7">
      <Controller
        name="payment.method"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <FieldLabel htmlFor="checkout-payment-method-1">
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent className="flex-1">
                    <FieldTitle>Credit Card</FieldTitle>
                  </FieldContent>
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/visa-icon.svg"
                    alt="Credit Card"
                    className="size-5"
                  />
                  <RadioGroupItem
                    value="creditCard"
                    id="checkout-payment-method-1"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="checkout-payment-method-2">
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent className="flex-1">
                    <FieldTitle>PayPal</FieldTitle>
                  </FieldContent>
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/paypal-icon.svg"
                    alt="PayPal"
                    className="size-5"
                  />
                  <RadioGroupItem
                    value="paypal"
                    id="checkout-payment-method-2"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="checkout-payment-method-3">
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldTitle>Online Bank Transfer</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    value="onlineBankTransfer"
                    id="checkout-payment-method-3"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <PaymentFieldsByMethod method={paymentMethod} />
    </div>
  );
};

const PaymentFieldsByMethod = ({ method }: { method: PaymentMethod }) => {
  const form = useFormContext();

  if (!method) return;

  switch (method) {
    case PAYMENT_METHODS.creditCard:
      return (
        <div className="space-y-3.5">
          <Controller
            name="payment.cardholderName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-normal"
                  htmlFor="checkout-payment-cardholderName"
                >
                  Cardholder Name
                </FieldLabel>
                <Input
                  {...field}
                  id="checkout-payment-cardholderName"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="payment.cardNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-normal"
                  htmlFor="checkout-payment-cardNumber"
                >
                  Card Number
                </FieldLabel>
                <Input
                  {...field}
                  id="checkout-payment-cardNumber"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div className="flex gap-3.5 max-sm:flex-col">
            <DateInput />
            <Controller
              name="payment.cvc"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="text-sm font-normal"
                    htmlFor="checkout-payment-cvc"
                  >
                    Card Number
                  </FieldLabel>
                  <Input
                    {...field}
                    id="checkout-payment-cvc"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </div>
      );
    case PAYMENT_METHODS.paypal:
      return (
        <Controller
          name="payment.payPalEmail"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel
                className="text-sm font-normal"
                htmlFor="checkout-payment-payPalEmail"
              >
                PayPal Email
              </FieldLabel>
              <Input
                {...field}
                type="email"
                placeholder="you-email-here@email.com"
                id="checkout-payment-payPalEmail"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      );
    case PAYMENT_METHODS.onlineBankTransfer:
      return (
        <div className="space-y-3.5">
          <Controller
            name="payment.bankName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-normal"
                  htmlFor="checkout-payment-bankName"
                >
                  Bank Name
                </FieldLabel>
                <Input
                  {...field}
                  placeholder="Bank Name"
                  id="checkout-payment-bankName"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="payment.accountNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-normal"
                  htmlFor="checkout-payment-accountNumber"
                >
                  Account Number
                </FieldLabel>
                <Input
                  {...field}
                  id="checkout-payment-accountNumber"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      );
    default:
      return null;
  }
};

const DateInput = () => {
  const form = useFormContext();

  return (
    <Controller
      name="payment.expiryDate"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            className="text-sm font-normal"
            htmlFor="checkout-payment-expiryDate"
          >
            Card Number
          </FieldLabel>
          <Input
            {...field}
            onChange={(e) => {
              let val = e.target.value;
              val = val.replace(/[^0-9/]/g, "");

              const prev = field.value ?? "";
              const isDeleting = val.length < prev.length;

              if (!isDeleting) {
                if (val.length === 2 && !val.includes("/")) {
                  val = val + "/";
                }
              }

              if (val.length > 5) {
                val = val.slice(0, 5);
              }

              field.onChange(val);
            }}
            pattern="^(0[1-9]|1[0-2])/[0-9]{2}$"
            placeholder="MM/YY"
            id="checkout-payment-expiryDate"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const Cart = ({ cartItems, form }: CartProps) => {
  const { fields, remove, update } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const formItems = form.watch("products");

  const totalPrice = formItems?.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0,
  );

  const handleRemove = useCallback(
    (index: number) => () => {
      remove(index);
    },
    [remove],
  );

  const handleQuantityChange = useCallback(
    (index: number) => (newQty: number) =>
      update(index, { ...fields[index], quantity: newQty }),
    [update, fields],
  );

  return (
    <div>
      <div className="border-b py-7">
        <h2 className="text-lg leading-relaxed font-semibold">Your Cart</h2>
      </div>
      <ul className="space-y-12 py-7">
        {fields.map((field, index) => {
          return (
            <li key={field.id}>
              <CartItem
                {...(cartItems.find(
                  (p) => p.product_id === field.product_id,
                ) as CartItem)}
                onRemoveClick={() => handleRemove(index)()}
                onQuantityChange={(newQty: number) =>
                  handleQuantityChange(index)(newQty)
                }
                index={index}
              />
            </li>
          );
        })}
      </ul>
      <div>
        <div className="space-y-3.5 border-y py-7">
          <div className="flex justify-between gap-3">
            <p className="text-sm">Subtotal</p>
          </div>
          <div className="flex justify-between gap-3">
            <p className="text-sm">Shipping</p>
            <p className="text-sm">Free</p>
          </div>
          <div className="flex justify-between gap-3">
            <p className="text-sm">Estimated Tax</p>
            <p className="text-sm">$35.80</p>
          </div>
        </div>
        <div className="py-7">
          <div className="flex justify-between gap-3">
            <p className="text-lg leading-tight font-medium">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({
  image,
  name,
  link,
  details,
  price,
  index,
  onQuantityChange,
  onRemoveClick,
}: CartItemProps) => {
  const { regular, currency } = price;

  return (
    <Card className="rounded-none border-none bg-background p-0 shadow-none">
      <div className="flex w-full gap-3.5 max-sm:flex-col">
        <div className="shrink-0 basis-25">
          <AspectRatio ratio={1} className="overflow-hidden rounded-lg">
            <img
              src={image}
              alt={name}
              className="block size-full object-cover object-center"
            />
          </AspectRatio>
        </div>
        <div className="flex-1">
          <div className="flex flex-col justify-between gap-3">
            <div className="flex w-full justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  <a href={link}>{name}</a>
                </CardTitle>
                <ProductDetails details={details} />
              </div>
            </div>
            <div className="flex w-full justify-between gap-3">
              <QuantityField
                index={index}
                onQuantityChange={onQuantityChange}
              />
              <Button size="icon" variant="ghost" onClick={onRemoveClick}>
                <Trash />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ProductDetails = ({
  details,
}: {
  details?: {
    label: string;
    value: string;
  }[];
}) => {
  if (!details) return;
  return (
    <ul>
      {details?.map((item, index) => {
        const isLast = index === details.length - 1;

        return (
          <li className="inline" key={`product-details-${index}`}>
            <dl className="inline text-xs text-muted-foreground">
              <dt className="inline">{item.label}: </dt>
              <dd className="inline">{item.value}</dd>
              {!isLast && <span className="mx-1 text-muted-foreground">/</span>}
            </dl>
          </li>
        );
      })}
    </ul>
  );
};

const QuantityField = ({
  index,
  onQuantityChange,
}: {
  index: number;
  onQuantityChange: (n: number) => void;
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={`products.${index}.quantity`}
      control={control}
      render={({ field }) => {
        return (
          <Field className="w-full max-w-28">
            {/* <QuantityInput
              inputProps={field}
              onValueChange={(newQty) => {
                field.onChange(newQty);
                onQuantityChange(newQty);
              }}
              className="rounded-none"
            /> */}
          </Field>
        );
      }}
    />
  );
};

export default function Checkout1({
  cartItems = CART_ITEMS,
  className,
}: Checkout1Props) {
  const [activeAccordion, setActiveAccordion] = useState("item-1");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const defaultProducts = cartItems.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price.sale ?? item.price.regular,
  }));

  const form = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      payment: {
        method: PAYMENT_METHODS.creditCard,
      },
      products: defaultProducts,
    },
  });

  const onSubmit = (data: CheckoutFormType) => {
    console.log(data);
  };

  const onContinue = (value: string) => {
    setActiveAccordion(value);
  };

  const handleOnValueChange = (value: string) => {
    setActiveAccordion(value);
  };

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
        );
        const data = await res.json();
        const results: Suggestion[] = (data || []).map((item: any) => ({
          placeId: item.place_id,
          name: item.name || item.display_name.split(",")[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  }, []);

  // ── Fetch rute OSRM ──────────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (dest: SearchResult) => {
    setLoadingRoute(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
          `${CENTER_POINT.lng},${CENTER_POINT.lat};${dest.lng},${dest.lat}` +
          `?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.routes?.length > 0) {
        const r = data.routes[0];
        setRoute({
          coordinates: r.geometry.coordinates,
          distance: r.distance,
          duration: r.duration,
        });

        // Titik tengah rute → fly ke sana
        const midLng = (CENTER_POINT.lng + dest.lng) / 2;
        const midLat = (CENTER_POINT.lat + dest.lat) / 2;
        setFlyTarget({ lng: midLng, lat: midLat, zoom: 14 });
      }
    } catch {
      setError("Gagal mengambil data rute.");
    } finally {
      setLoadingRoute(false);
    }
  }, []);

  // ── Proses lokasi (validasi radius + fetch rute) ─────────────────────────────
  const processLocation = useCallback(
    async (result: SearchResult) => {
      const distKm = haversineKm(
        CENTER_POINT.lat,
        CENTER_POINT.lng,
        result.lat,
        result.lng,
      );
      if (distKm > MAX_DISTANCE_KM) {
        setError(
          `Lokasi terlalu jauh (${distKm.toFixed(2)} km). Maks. radius ${MAX_DISTANCE_KM} km.`,
        );
        setDestination(null);
        setRoute(null);
        return;
      }
      setDestination(result);
      setError(null);
      await fetchRoute(result);
    },
    [fetchRoute],
  );

  // ── Handle input change ──────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  // ── Pilih suggestion ─────────────────────────────────────────────────────────
  const handleSelectSuggestion = async (s: Suggestion) => {
    setQuery(s.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setLoadingSearch(true);
    setRoute(null);
    setDestination(null);
    setError(null);
    await processLocation({
      name: s.name,
      displayName: s.displayName,
      lat: s.lat,
      lng: s.lng,
    });
    setLoadingSearch(false);
  };

  // ── Search manual (Enter / tombol) ───────────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    setLoadingSearch(true);
    setError(null);
    setRoute(null);
    setDestination(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
      );
      const data = await res.json();
      if (!data?.length) {
        setError("Lokasi tidak ditemukan.");
        return;
      }
      await processLocation({
        name: query,
        displayName: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      });
    } catch {
      setError("Gagal mencari lokasi.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolokasi.");
      return;
    }
    setLoadingGps(true);
    setError(null);
    setRoute(null);
    setDestination(null);
    setShowSuggestions(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let displayName = "Lokasi Saya";
        let name = "Lokasi Saya";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
          );
          const data = await res.json();
          if (data?.display_name) {
            displayName = data.display_name;
            name = data.name || data.display_name.split(",")[0];
          }
        } catch {}
        setQuery(name);
        await processLocation({ name, displayName, lat, lng });
        setLoadingGps(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Izin lokasi ditolak."
            : "Gagal mendapatkan lokasi GPS.",
        );
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setDestination(null);
    setRoute(null);
    setError(null);
    setFlyTarget({ lng: CENTER_POINT.lng, lat: CENTER_POINT.lat, zoom: 14 });
    inputRef.current?.focus();
  };

  const isLoading = loadingSearch || loadingGps || loadingRoute;

  return (
    <MainLayout breadcrumbs={[{ label: "Checkout" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <div className="container">
          <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Pesan
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                  Apa yang bisa kami bantu?
                </p>
              </div>
            </div>
          </div>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-17.5">
                <div>
                  {/* <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    value={activeAccordion}
                    onValueChange={handleOnValueChange}
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline [&>svg:last-child]:hidden [&[data-state=closed]>svg:nth-of-type(2)]:hidden [&[data-state=open]>svg:nth-of-type(1)]:hidden [&[data-state=open]>svg:nth-of-type(2)]:block">
                        Contact Information
                        <Plus className="pointer-events-none size-4 shrink-0 self-center text-muted-foreground" />
                        <Minus className="pointer-events-none hidden size-4 shrink-0 self-center text-muted-foreground" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-7">
                        <div className="space-y-7">
                          <ContactFields />
                          <Button
                            type="button"
                            className="w-full"
                            variant="secondary"
                            onClick={() => onContinue("item-2")}
                          >
                            Continue
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline [&>svg:last-child]:hidden [&[data-state=closed]>svg:nth-of-type(2)]:hidden [&[data-state=open]>svg:nth-of-type(1)]:hidden [&[data-state=open]>svg:nth-of-type(2)]:block">
                        Address
                        <Plus className="pointer-events-none size-4 shrink-0 self-center text-muted-foreground" />
                        <Minus className="pointer-events-none hidden size-4 shrink-0 self-center text-muted-foreground" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-7">
                        <div className="space-y-7">
                          <AddressFields />
                          <Button
                            type="button"
                            className="w-full"
                            variant="secondary"
                            onClick={() => onContinue("item-3")}
                          >
                            Continue
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline [&>svg:last-child]:hidden [&[data-state=closed]>svg:nth-of-type(2)]:hidden [&[data-state=open]>svg:nth-of-type(1)]:hidden [&[data-state=open]>svg:nth-of-type(2)]:block">
                        Shipping Method
                        <Plus className="pointer-events-none size-4 shrink-0 self-center text-muted-foreground" />
                        <Minus className="pointer-events-none hidden size-4 shrink-0 self-center text-muted-foreground" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-7">
                        <div className="space-y-7">
                          <ShippingMethodFields />
                          <Button
                            type="button"
                            className="w-full"
                            variant="secondary"
                            onClick={() => onContinue("item-4")}
                          >
                            Continue
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline [&>svg:last-child]:hidden [&[data-state=closed]>svg:nth-of-type(2)]:hidden [&[data-state=open]>svg:nth-of-type(1)]:hidden [&[data-state=open]>svg:nth-of-type(2)]:block">
                        Payment
                        <Plus className="pointer-events-none size-4 shrink-0 self-center text-muted-foreground" />
                        <Minus className="pointer-events-none hidden size-4 shrink-0 self-center text-muted-foreground" />
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-7">
                        <div className="space-y-7">
                          <PaymentFields />
                          <Button type="submit" className="w-full">
                            Checkout
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion> */}
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="location">
                        Tunjukkan Lokasi Anda
                      </FieldLabel>
                      <div className="space-y-3">
                        {/* ── Search Bar ── */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              ref={inputRef}
                              placeholder="Cari lokasi dalam radius 5 km..."
                              value={query}
                              onChange={handleInputChange}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                                if (e.key === "Escape")
                                  setShowSuggestions(false);
                              }}
                              onFocus={() =>
                                suggestions.length > 0 &&
                                setShowSuggestions(true)
                              }
                              disabled={isLoading}
                              className="pr-8"
                            />

                            {/* Clear button */}
                            {query && (
                              <button
                                onClick={handleClear}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <X className="size-4" />
                              </button>
                            )}

                            {/* Suggestions Dropdown */}
                            {showSuggestions && (
                              <div
                                ref={suggestionsRef}
                                className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg overflow-hidden"
                              >
                                {loadingSuggestions ? (
                                  <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Mencari...
                                  </div>
                                ) : (
                                  suggestions.map((s) => (
                                    <button
                                      key={s.placeId}
                                      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => handleSelectSuggestion(s)}
                                    >
                                      <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {s.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {s.displayName}
                                        </p>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <Button onClick={handleSearch} disabled={isLoading}>
                            {loadingSearch ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Search className="size-4" />
                            )}
                          </Button>

                          <Button
                            onClick={handleUseCurrentLocation}
                            disabled={isLoading}
                            variant="outline"
                            title="Gunakan lokasi saat ini"
                          >
                            {loadingGps ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <LocateFixed className="size-4" />
                            )}
                          </Button>
                        </div>

                        {/* ── Error ── */}
                        {error && (
                          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            <AlertCircle className="size-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}

                        {/* ── Info Rute ── */}
                        {route && destination && (
                          <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                            <Route className="size-4 text-primary shrink-0" />
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span>
                                <span className="text-muted-foreground">
                                  Tujuan:{" "}
                                </span>
                                <span className="font-medium">
                                  {destination.name}
                                </span>
                              </span>
                              <span>
                                <span className="text-muted-foreground">
                                  Jarak:{" "}
                                </span>
                                <span className="font-medium">
                                  {formatDistance(route.distance)}
                                </span>
                              </span>
                              <span>
                                <span className="text-muted-foreground">
                                  Estimasi:{" "}
                                </span>
                                <span className="font-medium">
                                  {formatDuration(route.duration)}
                                </span>
                              </span>
                            </div>
                            {loadingRoute && (
                              <Loader2 className="size-4 animate-spin ml-auto text-muted-foreground" />
                            )}
                          </div>
                        )}

                        {/* ── Map ── */}
                        <Card className="h-80 p-0 overflow-hidden relative">
                          <Map
                            center={[CENTER_POINT.lng, CENTER_POINT.lat]}
                            zoom={14}
                          >
                            {/* FlyTo controller — harus di dalam <Map> */}
                            <MapFlyController target={flyTarget} />

                            <MapControls showCompass showFullscreen />

                            {/* Rute */}
                            {route && (
                              <MapRoute
                                coordinates={route.coordinates}
                                color="#6366f1"
                                width={5}
                                opacity={0.85}
                              />
                            )}

                            {/* Marker titik pusat */}
                            <MapMarker
                              longitude={CENTER_POINT.lng}
                              latitude={CENTER_POINT.lat}
                            >
                              <MarkerContent>
                                <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                                <MarkerLabel position="top">
                                  {CENTER_POINT.name}
                                </MarkerLabel>
                              </MarkerContent>
                              <MarkerPopup>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground text-sm">
                                    {CENTER_POINT.name}
                                  </p>
                                  <p className="text-muted-foreground text-xs tabular-nums">
                                    {CENTER_POINT.lat.toFixed(5)},{" "}
                                    {CENTER_POINT.lng.toFixed(5)}
                                  </p>
                                </div>
                              </MarkerPopup>
                            </MapMarker>

                            {/* Marker destinasi */}
                            {destination && (
                              <MapMarker
                                longitude={destination.lng}
                                latitude={destination.lat}
                              >
                                <MarkerContent>
                                  <MapPin
                                    className="fill-rose-500 stroke-white drop-shadow-md"
                                    size={28}
                                  />
                                </MarkerContent>
                                <MarkerTooltip>
                                  {destination.name}
                                </MarkerTooltip>
                                <MarkerPopup>
                                  <div className="space-y-1 max-w-[200px]">
                                    <p className="font-medium text-foreground text-sm">
                                      {destination.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                                      {destination.displayName}
                                    </p>
                                    <p className="text-muted-foreground text-xs tabular-nums">
                                      {destination.lat.toFixed(5)},{" "}
                                      {destination.lng.toFixed(5)}
                                    </p>
                                  </div>
                                </MarkerPopup>
                              </MapMarker>
                            )}
                          </Map>

                          {/* Overlay loading rute */}
                          {loadingRoute && (
                            <div className="absolute inset-0 bg-background/40 flex items-center justify-center pointer-events-none">
                              <div className="bg-background border rounded-md px-3 py-2 flex items-center gap-2 text-sm shadow-md">
                                <Loader2 className="size-4 animate-spin" />
                                Memuat rute...
                              </div>
                            </div>
                          )}
                        </Card>

                        <p className="text-xs text-muted-foreground text-center">
                          Radius maksimal:{" "}
                          <span className="font-medium">
                            {MAX_DISTANCE_KM} km
                          </span>{" "}
                          dari titik pusat
                        </p>
                      </div>
                      <FieldDescription>
                        This appears on invoices and emails.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <Input id="username" autoComplete="off" aria-invalid />
                      <FieldError>Choose another username.</FieldError>
                    </Field>
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="newsletter">
                        Subscribe to the newsletter
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                </div>
                <div>
                  <Cart form={form} cartItems={cartItems} />
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </main>
    </MainLayout>
  );
}
