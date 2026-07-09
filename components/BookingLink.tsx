import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { TREATWELL_BOOKING_URL } from "@/lib/siteConfig";

type BookingLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  children: ReactNode;
};

export default function BookingLink({ children, ...props }: BookingLinkProps) {
  return (
    <a href={TREATWELL_BOOKING_URL} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
