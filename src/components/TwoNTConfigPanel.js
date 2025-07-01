import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './ConfigPanel.css';
export const TwoNTConfigPanel = ({ config, onConfigChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onConfigChange({
            ...config,
            [name]: Number(value),
        });
    };
    return (_jsxs("div", { className: "config-panel two-nt-config", children: [_jsxs("div", { className: "config-group", children: [_jsxs("h4", { className: "config-group-title", children: [_jsx("span", { className: "config-icon", children: "\uD83D\uDDBC\uFE0F" }), " Two n T Settings"] }), _jsxs("div", { className: "config-item", children: [_jsxs("label", { htmlFor: "spacing", children: [_jsx("span", { className: "label-icon", children: "\u2194\uFE0F" }), " Spacing (px)"] }), _jsxs("div", { className: "input-wrapper", children: [_jsx("input", { id: "spacing", type: "number", name: "spacing", value: config.spacing, onChange: handleChange, min: "0", max: "100", step: "0.1" }), _jsx("div", { className: "config-description", children: "Space between pages on the sheet" })] })] }), _jsxs("div", { className: "config-item", children: [_jsxs("label", { htmlFor: "resolution", children: [_jsx("span", { className: "label-icon", children: "\uD83D\uDD0D" }), " Resolution (DPI)"] }), _jsxs("div", { className: "input-wrapper", children: [_jsx("input", { id: "resolution", type: "number", name: "resolution", value: config.resolution, onChange: handleChange, min: "72", max: "600", step: "1" }), _jsx("div", { className: "config-description", children: "Higher values produce larger, more detailed files" })] })] })] }), _jsxs("div", { className: "two-nt-info-panel", children: [_jsx("span", { className: "info-icon", children: "\uD83D\uDCA1" }), _jsx("p", { children: "The Two n T layout places two pages side by side in landscape orientation, perfect for book spreads and side-by-side comparisons." })] })] }));
};
