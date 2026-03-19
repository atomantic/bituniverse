import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function BreadcrumbNav({ items }) {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        color: "var(--theme-secondary)",
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <Typography
              component="span"
              sx={{ color: "var(--theme-accent)", fontSize: "0.7rem", opacity: 0.4 }}
            >
              /
            </Typography>
          )}
          {index === items.length - 1 ? (
            <Typography component="span" sx={{ fontSize: "0.7rem" }}>
              {item.label}
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                opacity: 0.7,
                "&:hover": { opacity: 1, color: "var(--theme-accent)" },
              }}
              onClick={() => navigate(item.path)}
            >
              {index === 0 && <ArrowBackIcon sx={{ fontSize: 14 }} />}
              <Typography component="span" sx={{ fontSize: "0.7rem" }}>
                {item.label}
              </Typography>
            </Box>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}
