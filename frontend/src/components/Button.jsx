/**
 * Button — Reusable button component
 *
 * Props:
 *  variant  – 'primary' | 'secondary' | 'ghost' | 'white' | 'danger'
 *  size     – 'sm' | 'md' | 'lg' | 'xl'
 *  loading  – show spinner
 *  fullWidth – stretch to container
 *  as       – render as different element (e.g. 'a', Link)
 *  All native <button> props are forwarded.
 */

import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    as: Tag = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </Tag>
  );
});

export default Button;
