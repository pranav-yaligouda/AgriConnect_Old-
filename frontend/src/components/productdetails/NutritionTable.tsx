import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";

const NutritionTable = ({ nutrition }: { nutrition: any }) => {
  return (
    <TableContainer>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">Calories</TableCell>
            <TableCell>{nutrition.calories} kcal</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">Protein</TableCell>
            <TableCell>{nutrition.protein}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">Carbs</TableCell>
            <TableCell>{nutrition.carbs}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">Fat</TableCell>
            <TableCell>{nutrition.fat}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">Fiber</TableCell>
            <TableCell>{nutrition.fiber}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">Vitamins</TableCell>
            <TableCell>{nutrition.vitamins}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NutritionTable; 