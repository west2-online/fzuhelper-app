import { DescriptionListDescription, DescriptionListRow, DescriptionListTerm } from '@/components/DescriptionList';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface CreditCardProps {
  label: string; // 学分类型
  value: unknown; // 学分值
}

export const CreditCard: React.FC<CreditCardProps> = ({ label, value }) => {
  const raw = String(value ?? '').trim();
  const displayValue = raw || '—';
  const isZeroOrEmpty = !raw || (Number(raw) === 0 && !Number.isNaN(Number(raw)));
  const secondaryClass = isZeroOrEmpty ? 'text-text-secondary' : undefined;

  return (
    <DescriptionListRow>
      <DescriptionListTerm className="max-w-[55%]">
        <Text className={secondaryClass}>{label}</Text>
      </DescriptionListTerm>
      <DescriptionListDescription>
        <Text className={cn('font-bold', secondaryClass)}>{displayValue}</Text>
      </DescriptionListDescription>
    </DescriptionListRow>
  );
};
