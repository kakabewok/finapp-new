export const chartTheme = {
  axis: {
    fontSize: 12,
    fill: "var(--muted-foreground)",
  },
  grid: {
    stroke: "var(--border)",
    strokeDasharray: "3 3",
    vertical: false,
  },
  tooltip: {
    contentStyle: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      fontSize: "13px",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      color: "var(--foreground)"
    },
    itemStyle: {
      color: "var(--foreground)",
      fontWeight: 500,
    },
    labelStyle: {
      color: "var(--foreground)",
      fontWeight: 600,
      marginBottom: "4px",
    },
    cursor: {
      fill: "var(--muted)",
      opacity: 0.5,
    }
  },
  legend: {
    wrapperStyle: {
      fontSize: "12px",
      paddingTop: "8px",
    }
  }
};

export const CHART_COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#EC4899", // Pink
];

export const getChartColor = (index: number, customColor?: string) => {
  if (customColor && customColor.startsWith('#')) return customColor;
  return CHART_COLORS[index % CHART_COLORS.length];
};
