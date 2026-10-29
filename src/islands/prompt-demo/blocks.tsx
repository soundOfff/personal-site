import type { GeneratedBlock } from './types';

/**
 * Component library adapted from /Users/User/Tomi/gen-ui/60-seconds/components/blocks.tsx
 * Presentational React components for the demo. Props are typed content, no markup.
 */

function cx(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface HeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function Heading({ title, subtitle, align }: HeadingProps) {
  return (
    <div className={cx('pb-heading', align === 'center' && 'pb-center')}>
      <h2 className="pb-heading-title">{title}</h2>
      {subtitle && <p className="pb-heading-sub">{subtitle}</p>}
    </div>
  );
}

interface ParagraphProps {
  content: string;
  align?: 'left' | 'center';
  muted?: boolean;
}

export function Paragraph({ content, align, muted }: ParagraphProps) {
  return (
    <p className={cx('pb-paragraph', align === 'center' && 'pb-center', muted && 'pb-muted')}>{content}</p>
  );
}

interface FieldProps {
  label: string;
  type: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

export function Field({ label, type, placeholder, helpText, required }: FieldProps) {
  return (
    <label className="pb-field">
      <span className="pb-label">
        {label}
        {required && <span className="pb-req" aria-hidden> *</span>}
      </span>
      {type === 'textarea' ? (
        <textarea className="pb-input pb-textarea" placeholder={placeholder} rows={3} readOnly />
      ) : (
        <input className="pb-input" type={type} placeholder={placeholder} readOnly />
      )}
      {helpText && <span className="pb-help">{helpText}</span>}
    </label>
  );
}

interface CheckboxRowProps {
  items: Array<{ label: string; checked?: boolean }>;
}

export function CheckboxRow({ items }: CheckboxRowProps) {
  return (
    <div className="pb-checkrow">
      {items.map((it, i) => (
        <label key={i} className="pb-check">
          <input type="checkbox" defaultChecked={it.checked} />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}

interface ButtonRowProps {
  buttons: Array<{ label: string; variant: string }>;
  align?: string;
}

export function ButtonRow({ buttons, align }: ButtonRowProps) {
  return (
    <div className={cx('pb-buttonrow', `pb-align-${align ?? 'left'}`)}>
      {buttons.map((b, i) => (
        <button key={i} type="button" className={cx('pb-btn', `pb-btn-${b.variant}`)}>
          {b.label}
        </button>
      ))}
    </div>
  );
}

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
}

const ALERT_ICON: Record<AlertProps['variant'], string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export function Alert({ variant, title, message }: AlertProps) {
  return (
    <div className={cx('pb-alert', `pb-alert-${variant}`)} role="status">
      <span className="pb-alert-icon" aria-hidden>
        {ALERT_ICON[variant]}
      </span>
      <div className="pb-alert-body">
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

interface BadgeRowProps {
  badges: Array<{ label: string; tone?: string }>;
}

export function BadgeRow({ badges }: BadgeRowProps) {
  return (
    <div className="pb-badgerow">
      {badges.map((b, i) => (
        <span key={i} className={cx('pb-badge', `pb-badge-${b.tone ?? 'neutral'}`)}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) return <hr className="pb-divider" />;
  return (
    <div className="pb-divider-label">
      <span>{label}</span>
    </div>
  );
}

interface PriceTagProps {
  amount: string;
  period?: string;
  note?: string;
}

export function PriceTag({ amount, period, note }: PriceTagProps) {
  return (
    <div className="pb-pricetag">
      <div className="pb-price-line">
        <span className="pb-price-amount">{amount}</span>
        {period && <span className="pb-price-period">{period}</span>}
      </div>
      {note && <span className="pb-price-note">{note}</span>}
    </div>
  );
}

interface ListProps {
  title?: string;
  ordered?: boolean;
  items: Array<{
    primary: string;
    secondary?: string;
    checked?: boolean;
    unavailable?: boolean;
  }>;
}

function listMarker(checked: boolean | undefined, ordered: boolean | undefined, index: number): string {
  if (checked != null) return checked ? '✓' : '○';
  if (ordered) return `${index + 1}.`;
  return '•';
}

export function List({ title, ordered, items }: ListProps) {
  return (
    <div className="pb-list">
      {title && <h4 className="pb-list-title">{title}</h4>}
      <div className="pb-list-items">
        {items.map((it, i) => (
          <div key={i} className={cx('pb-list-item', it.unavailable && 'pb-list-unavailable')}>
            <span className={cx('pb-list-marker', it.checked != null && 'pb-list-check')}>
              {listMarker(it.checked, ordered, i)}
            </span>
            <span className="pb-list-text">
              <span className="pb-list-primary">{it.primary}</span>
              {it.secondary && <span className="pb-list-secondary">{it.secondary}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RenderedBlock({ block }: { block: GeneratedBlock }) {
  switch (block.component) {
    case 'heading': return <Heading {...block.props} />;
    case 'paragraph': return <Paragraph {...block.props} />;
    case 'field': return <Field {...block.props} />;
    case 'checkboxRow': return <CheckboxRow {...block.props} />;
    case 'buttonRow': return <ButtonRow {...block.props} />;
    case 'alert': return <Alert {...block.props} />;
    case 'badgeRow': return <BadgeRow {...block.props} />;
    case 'divider': return <Divider {...block.props} />;
    case 'priceTag': return <PriceTag {...block.props} />;
    case 'list': return <List {...block.props} />;
  }
}

export function RenderedUI({ blocks }: { blocks: GeneratedBlock[] }) {
  return <div className="pb-canvas-stack">{blocks.map((block, index) => <RenderedBlock key={index} block={block} />)}</div>;
}
