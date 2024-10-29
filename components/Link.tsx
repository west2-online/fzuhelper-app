import { Link as RouterLink, type Href } from 'expo-router';
import { Button, styled, type ButtonProps, type GetProps } from 'tamagui';

export const Link = styled(RouterLink);

export type LinkProps = GetProps<typeof Link>;

export const LinkButton: React.FC<
  React.PropsWithChildren<
    Omit<ButtonProps, 'href' | 'hrefAttrs'> & { href: Href }
  >
> = ({ href, children, ...props }) => (
  <RouterLink href={href} asChild>
    <Button {...props}>{children}</Button>
  </RouterLink>
);
