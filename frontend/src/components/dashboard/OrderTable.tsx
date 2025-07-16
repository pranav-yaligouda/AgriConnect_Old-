import React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface OrderTableProps {
  orders: any[];
}

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const { t } = useTranslation();
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('dashboard.orderId')}</TableCell>
            <TableCell>{t('dashboard.date')}</TableCell>
            <TableCell>{t('dashboard.items')}</TableCell>
            <TableCell>{t('dashboard.amount')}</TableCell>
            <TableCell>{t('dashboard.status')}</TableCell>
            <TableCell>{t('dashboard.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">{t('dashboard.noOrders')}</TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderId}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{/* actions here */}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderTable; 