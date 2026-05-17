import { CircularMeter } from '../ui/CircularMeter'

type ConfidenceMeterProps = {
  value: number
}

export function ConfidenceMeter({ value }: ConfidenceMeterProps) {
  return <CircularMeter value={value} label="Confidence" />
}