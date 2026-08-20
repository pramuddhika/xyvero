/* eslint-disable prettier/prettier */
import {
  Circle,
  Wallet,
  House,
  ShoppingCart,
  Utensils,
  Fuel,
  Car,
  PiggyBank,
  CreditCard,
  Briefcase
} from 'lucide-react'

const Icons = {
  circle: Circle,
  wallet: Wallet,
  house: House,
  shopping: ShoppingCart,
  food: Utensils,
  fuel: Fuel,
  car: Car,
  savings: PiggyBank,
  card: CreditCard,
  salary: Briefcase
} as const

interface Props {
  icon: string
}

export function Icon({ icon }: Props): React.JSX.Element {
  const IconComponent = Icons[icon as keyof typeof Icons] || Icons.circle

  return <IconComponent size={20} />
}
