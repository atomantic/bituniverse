import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function BreadcrumbNav({ items }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2,
        color: "var(--theme-secondary)",
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <Typography component="span" sx={{ color: "var(--theme-accent)" }}>
              /
            </Typography>
          )}
          {index === items.length - 1 ? (
            <Typography component="span">{item.label}</Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                "&:hover": {
                  color: "var(--theme-accent)",
                },
              }}
              onClick={() => navigate(item.path)}
            >
              {index === 0 && <ArrowBackIcon sx={{ fontSize: 16 }} />}
              <Typography component="span">{item.label}</Typography>
            </Box>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}
