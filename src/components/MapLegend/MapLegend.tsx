import { FormGroup, FormLabel, List } from '@mui/material';
import React from 'react';

const legendStyle:React.CSSProperties = {
  //id: "legend",
  position: "absolute",
  top: "10px",
  right: "10px",
  minHeight: "50px",
  minWidth: '50px',
  backgroundColor: "white",
  padding: "10px",
  borderRadius: '5px',
  boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
}

interface MapLegendProps {
  children?: React.ReactNode,
}

export function MapLegend({children}: MapLegendProps) {
  return <FormGroup aria-label='Green area types' style={legendStyle}>
      <FormLabel>Area types</FormLabel>
      <List>
      {children && React.Children.toArray(children).filter((child, i) => {
        const tempchild = child as React.ReactElement<any>;
        if (typeof tempchild.type !== "string") {
          if (tempchild.type.name.includes("LegendItem")) {
            return child;
          }
        }
      })}
      </List>
      {children && React.Children.toArray(children).filter((child, i) => {
          const tempchild = child as React.ReactElement<any>;
          if (typeof tempchild.type !== "string") {
            if (!tempchild.type.name.includes("LegendItem")) {
              return child;
            }
          }
        })}
    </FormGroup>;
}