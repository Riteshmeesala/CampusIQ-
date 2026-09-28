import React, { useState } from 'react';
import {
  Box, Typography, Paper, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, IconButton
} from '@mui/material';
import {
  ContentCopy, Check, Terminal,
  LightbulbOutlined, WarningAmberOutlined,
  CheckCircleOutline, CampaignOutlined,
  TaskAlt
} from '@mui/icons-material';

// ── Inline Rich Text Formatter ───────────────────────────────────────────
export function formatInlineText(text) {
  if (!text) return null;

  // Split by inline code first: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <Box
          component="code"
          key={`code-${idx}`}
          sx={{
            px: 0.75,
            py: 0.15,
            mx: 0.25,
            bgcolor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#0f172a',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {codeContent}
        </Box>
      );
    }

    // Process bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
        const boldText = bPart.slice(2, -2);
        return (
          <Box
            component="strong"
            key={`bold-${idx}-${bIdx}`}
            sx={{
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {formatItalicText(boldText, `b-${idx}-${bIdx}`)}
          </Box>
        );
      }
      return formatItalicText(bPart, `t-${idx}-${bIdx}`);
    });
  });
}

function formatItalicText(text, keyPrefix) {
  if (!text) return null;
  const italicParts = text.split(/(\*[^*]+\*)/g);
  return italicParts.map((iPart, iIdx) => {
    if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length >= 2) {
      return (
        <Box
          component="em"
          key={`${keyPrefix}-it-${iIdx}`}
          sx={{ fontStyle: 'italic', color: '#475569' }}
        >
          {iPart.slice(1, -1)}
        </Box>
      );
    }
    return iPart;
  });
}

// ── Status Chip Helper for Table Cells ─────────────────────────────────
function renderCellContent(cellText) {
  const trimmed = cellText.trim();
  const lower = trimmed.toLowerCase();

  // Positive status badges
  if (
    lower.includes('eligible') ||
    lower.includes('safe') ||
    lower.includes('good standing') ||
    lower.includes('active') ||
    lower.includes('present') ||
    lower.includes('paid') ||
    lower.includes('up') ||
    lower.includes('distinction') ||
    lower.includes('outstanding') ||
    lower.includes('passed')
  ) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip
          label={trimmed.replace(/[`✅🟢🌟]/g, '').trim()}
          size="small"
          sx={{
            bgcolor: '#ecfdf5',
            color: '#065f46',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #a7f3d0',
            height: 22,
          }}
        />
      </Box>
    );
  }

  // Warning or Pending status badges
  if (
    lower.includes('pending') ||
    lower.includes('due') ||
    lower.includes('risk') ||
    lower.includes('shortage') ||
    lower.includes('absent') ||
    lower.includes('open') ||
    lower.includes('scheduled')
  ) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Chip
          label={trimmed.replace(/[`⏳⚠️🔴]/g, '').trim()}
          size="small"
          sx={{
            bgcolor: lower.includes('pending') || lower.includes('scheduled') ? '#eff6ff' : '#fef2f2',
            color: lower.includes('pending') || lower.includes('scheduled') ? '#1e40af' : '#991b1b',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: `1px solid ${lower.includes('pending') || lower.includes('scheduled') ? '#bfdbfe' : '#fecaca'}`,
            height: 22,
          }}
        />
      </Box>
    );
  }

  return formatInlineText(trimmed);
}

// ── Code Block Component (ChatGPT / Gemini Slate Terminal) ──────────────
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        my: 1.5,
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #334155',
        bgcolor: '#0f172a',
        boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.75,
          bgcolor: '#1e293b',
          borderBottom: '1px solid #334155',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Terminal sx={{ fontSize: 16, color: '#94a3b8' }} />
          <Typography
            sx={{
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#cbd5e1',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {language || 'code'}
          </Typography>
        </Box>
        <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy code'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? '#34d399' : '#94a3b8',
              fontSize: '0.75rem',
              gap: 0.5,
              '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
              {copied ? 'Copied' : 'Copy'}
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.82rem',
          lineHeight: 1.6,
          color: '#e2e8f0',
          bgcolor: '#0f172a',
        }}
      >
        <code>{code}</code>
      </Box>
    </Box>
  );
}

// ── Markdown Table (ChatGPT / Gemini Clean Grid) ────────────────────────
function SystematicTable({ headers, rows }) {
  if (!headers || headers.length === 0) return null;

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        my: 1.5,
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            {headers.map((h, i) => (
              <TableCell
                key={i}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: '#334155',
                  borderBottom: '1px solid #cbd5e1',
                  py: 1.1,
                  px: 1.75,
                  letterSpacing: '0.01em',
                }}
              >
                {formatInlineText(h.trim())}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rIdx) => (
            <TableRow
              key={rIdx}
              sx={{
                bgcolor: rIdx % 2 === 1 ? '#f8fafc' : '#ffffff',
                '&:hover': { bgcolor: '#f1f5f9' },
                transition: 'background-color 0.1s ease',
              }}
            >
              {row.map((cell, cIdx) => (
                <TableCell
                  key={cIdx}
                  sx={{
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    borderBottom: rIdx === rows.length - 1 ? 'none' : '1px solid #f1f5f9',
                    py: 1,
                    px: 1.75,
                  }}
                >
                  {renderCellContent(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Systematic Procedure Step Card (ChatGPT / Gemini Style) ──────────────
function ProcedureStepCard({ stepNumber, title, children }) {
  return (
    <Box
      sx={{
        my: 1.25,
        p: 1.75,
        borderRadius: '8px',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #2563eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: '12px',
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Step {stepNumber}
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#0f172a',
          }}
        >
          {formatInlineText(title)}
        </Typography>
      </Box>
      <Box sx={{ pl: 0.5 }}>
        {children}
      </Box>
    </Box>
  );
}

// ── Themed Callout Box ──────────────────────────────────────────────────
function CalloutBox({ icon, text }) {
  const isTip = icon?.includes('💡') || text.toLowerCase().startsWith('tip');
  const isWarning = icon?.includes('⚠️') || text.toLowerCase().startsWith('note') || text.toLowerCase().startsWith('warning');
  const isAction = icon?.includes('👉') || text.toLowerCase().startsWith('action');
  const isNotice = icon?.includes('📢') || text.toLowerCase().startsWith('notice') || text.toLowerCase().startsWith('circular');
  const isSuccess = icon?.includes('✅') || text.toLowerCase().startsWith('status');

  let borderColor = '#bfdbfe';
  let borderLeftColor = '#2563eb';
  let bgColor = '#eff6ff';
  let textColor = '#1e3a8a';
  let iconComponent = <LightbulbOutlined sx={{ fontSize: 18, color: '#2563eb' }} />;

  if (isTip) {
    borderColor = '#fef08a';
    borderLeftColor = '#eab308';
    bgColor = '#fefce8';
    textColor = '#854d0e';
    iconComponent = <LightbulbOutlined sx={{ fontSize: 18, color: '#ca8a04' }} />;
  } else if (isWarning) {
    borderColor = '#fed7aa';
    borderLeftColor = '#f97316';
    bgColor = '#fff7ed';
    textColor = '#9a3412';
    iconComponent = <WarningAmberOutlined sx={{ fontSize: 18, color: '#ea580c' }} />;
  } else if (isAction) {
    borderColor = '#ddd6fe';
    borderLeftColor = '#7c3aed';
    bgColor = '#f5f3ff';
    textColor = '#5b21b6';
    iconComponent = <TaskAlt sx={{ fontSize: 18, color: '#7c3aed' }} />;
  } else if (isNotice) {
    borderColor = '#bfdbfe';
    borderLeftColor = '#2563eb';
    bgColor = '#eff6ff';
    textColor = '#1e3a8a';
    iconComponent = <CampaignOutlined sx={{ fontSize: 18, color: '#2563eb' }} />;
  } else if (isSuccess) {
    borderColor = '#bbf7d0';
    borderLeftColor = '#16a34a';
    bgColor = '#f0fdf4';
    textColor = '#166534';
    iconComponent = <CheckCircleOutline sx={{ fontSize: 18, color: '#16a34a' }} />;
  }

  return (
    <Box
      sx={{
        my: 1.25,
        p: 1.5,
        px: 1.75,
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderLeftColor}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
      }}
    >
      <Box sx={{ mt: 0.15, flexShrink: 0 }}>
        {iconComponent}
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.84rem',
          lineHeight: 1.6,
          color: textColor,
          fontWeight: 500,
        }}
      >
        {formatInlineText(text)}
      </Typography>
    </Box>
  );
}

// ── Master Structured AI Message Component ───────────────────────────────
export default function StructuredAIResponse({ text, showCopyAll = false }) {
  const [copiedAll, setCopiedAll] = useState(false);

  if (!text) return null;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code Block: ```lang ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace(/^```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        language: lang,
        code: codeLines.join('\n'),
      });
      i++;
      continue;
    }

    // 2. Horizontal Divider: --- or *** or ___
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 3. Markdown Table Detection: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].slice(1, -1).split('|');
        const isSeparator = tableLines[1].includes('---');
        const rawRows = isSeparator ? tableLines.slice(2) : tableLines.slice(1);
        const rows = rawRows.map(r => r.slice(1, -1).split('|'));

        blocks.push({
          type: 'table',
          headers: rawHeaders,
          rows: rows,
        });
        continue;
      }
    }

    // 4. Systematic Procedure Step: #### Step 1: ... or **Step 1:** ...
    const stepMatch = trimmed.match(/^(?:#{3,4}\s+|\*\*)Step\s+(\d+)[:.]\s*(.+?)(?:\*\*)?$/i);
    if (stepMatch) {
      const stepNum = stepMatch[1];
      const stepTitle = stepMatch[2];
      const stepLines = [];
      i++;

      // Collect lines belonging to this step until next step, header, table, or divider
      while (
        i < lines.length &&
        !lines[i].trim().match(/^(?:#{3,4}\s+|\*\*)Step\s+\d+[:.]/i) &&
        !lines[i].trim().startsWith('###') &&
        !lines[i].trim().startsWith('---') &&
        !lines[i].trim().startsWith('|')
      ) {
        if (lines[i].trim()) {
          stepLines.push(lines[i].trim());
        }
        i++;
      }

      blocks.push({
        type: 'procedure_step',
        stepNumber: stepNum,
        title: stepTitle,
        contentLines: stepLines,
      });
      continue;
    }

    // 5. Callouts & Important Notes (💡, ⚠️, 👉, ✅, 📌, 📢, > Blockquotes)
    const calloutMatch = trimmed.match(/^(?:>\s*)?(💡|⚠️|👉|✅|📌|📢|\*\*(?:Tip|Note|Action|Warning|Recommendation):\*\*)\s*(.*)/i);
    if (calloutMatch) {
      const icon = calloutMatch[1];
      const rest = calloutMatch[2];
      blocks.push({
        type: 'callout',
        icon: icon,
        text: rest || trimmed.replace(/^[>\s]+/, ''),
      });
      i++;
      continue;
    }

    // 6. Headers: ### Header, ## Header, # Header
    const headerMatch = rawLine.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      blocks.push({
        type: 'header',
        level: level,
        text: title,
      });
      i++;
      continue;
    }

    // 7. Numbered List Item: 1. ... or 2. ...
    const numMatch = rawLine.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      blocks.push({
        type: 'numbered_item',
        number: numMatch[1],
        text: numMatch[2],
      });
      i++;
      continue;
    }

    // 8. Bullet List Item: - ... or * ... or • ...
    const bulletMatch = rawLine.match(/^(\s*)([-*•])\s+(.+)/);
    if (bulletMatch) {
      const isIndented = bulletMatch[1].length > 0;
      blocks.push({
        type: 'bullet_item',
        isIndented: isIndented,
        text: bulletMatch[3],
      });
      i++;
      continue;
    }

    // 9. Regular paragraph or spacer
    if (!trimmed) {
      blocks.push({ type: 'spacer' });
    } else {
      blocks.push({
        type: 'paragraph',
        text: rawLine,
      });
    }
    i++;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative' }}>
      {showCopyAll && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Tooltip title={copiedAll ? 'Response copied!' : 'Copy response'}>
            <IconButton
              size="small"
              onClick={handleCopyAll}
              sx={{
                fontSize: '0.72rem',
                color: copiedAll ? '#16a34a' : '#64748b',
                gap: 0.5,
                p: 0.5,
                px: 1,
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' },
              }}
            >
              {copiedAll ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {copiedAll ? 'Copied' : 'Copy'}
              </Typography>
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {blocks.map((b, idx) => {
        if (b.type === 'code') {
          return <CodeBlock key={idx} language={b.language} code={b.code} />;
        }

        if (b.type === 'divider') {
          return <Divider key={idx} sx={{ my: 1.5, borderColor: '#e2e8f0' }} />;
        }

        if (b.type === 'table') {
          return <SystematicTable key={idx} headers={b.headers} rows={b.rows} />;
        }

        if (b.type === 'procedure_step') {
          return (
            <ProcedureStepCard key={idx} stepNumber={b.stepNumber} title={b.title}>
              {b.contentLines.map((cLine, cIdx) => {
                const subBullet = cLine.match(/^[-*•]\s+(.+)/);
                if (subBullet) {
                  return (
                    <Box
                      key={cIdx}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.25,
                        my: 0.4,
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: '#2563eb',
                          mt: 0.85,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.84rem', lineHeight: 1.55, color: '#334155' }}
                      >
                        {formatInlineText(subBullet[1])}
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Typography
                    key={cIdx}
                    variant="body2"
                    sx={{ fontSize: '0.84rem', lineHeight: 1.6, color: '#334155', my: 0.3 }}
                  >
                    {formatInlineText(cLine)}
                  </Typography>
                );
              })}
            </ProcedureStepCard>
          );
        }

        if (b.type === 'callout') {
          return <CalloutBox key={idx} icon={b.icon} text={b.text} />;
        }

        if (b.type === 'header') {
          return (
            <Box
              key={idx}
              sx={{
                mt: idx === 0 ? 0.25 : 1.75,
                mb: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: b.level <= 2 ? '1px solid #e2e8f0' : 'none',
                pb: b.level <= 2 ? 0.75 : 0,
              }}
            >
              <Typography
                variant={b.level === 1 ? 'h5' : b.level === 2 ? 'h6' : 'subtitle1'}
                sx={{
                  fontWeight: 800,
                  fontSize: b.level === 1 ? '1.18rem' : b.level === 2 ? '1.02rem' : '0.94rem',
                  color: '#0f172a',
                  letterSpacing: '-0.015em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {formatInlineText(b.text)}
              </Typography>
            </Box>
          );
        }

        if (b.type === 'numbered_item') {
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                my: 0.4,
                pl: 0.5,
              }}
            >
              <Box
                sx={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.2,
                  flexShrink: 0,
                }}
              >
                {b.number}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  color: '#1e293b',
                }}
              >
                {formatInlineText(b.text)}
              </Typography>
            </Box>
          );
        }

        if (b.type === 'bullet_item') {
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                my: 0.35,
                pl: b.isIndented ? 3 : 0.75,
              }}
            >
              <Box
                sx={{
                  width: b.isIndented ? 4 : 5,
                  height: b.isIndented ? 4 : 5,
                  borderRadius: '50%',
                  bgcolor: b.isIndented ? '#94a3b8' : '#2563eb',
                  mt: 0.85,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  color: '#1e293b',
                }}
              >
                {formatInlineText(b.text)}
              </Typography>
            </Box>
          );
        }

        if (b.type === 'spacer') {
          return <Box key={idx} sx={{ height: 6 }} />;
        }

        return (
          <Typography
            key={idx}
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.65,
              color: '#1e293b',
              mb: 0.25,
            }}
          >
            {formatInlineText(b.text)}
          </Typography>
        );
      })}
    </Box>
  );
}
