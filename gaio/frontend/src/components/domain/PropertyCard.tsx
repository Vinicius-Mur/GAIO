import { ReactNode } from 'react';
import { Card } from '../common/Card';

export const PropertyCard = ({ children }: { children: ReactNode }) => <Card className='space-y-5'>{children}</Card>;
