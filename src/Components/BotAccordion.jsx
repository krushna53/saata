import React, { useMemo, useState } from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';

// Years >= this are shown up front; older years appear after clicking "More".
const MORE_CUTOFF_YEAR = 2019;
const YEAR_RE = /^\d{4}$/;

const extractText = (node) => {
  if (!node.content) return node.value || '';
  return node.content.map(extractText).join('');
};

const isSectionTitle = (node) => {
  if ([BLOCKS.HEADING_2, BLOCKS.HEADING_3, BLOCKS.HEADING_4].includes(node.nodeType)) return true;
  if (node.nodeType !== BLOCKS.PARAGRAPH) return false;
  const texts = (node.content || []).filter(
    (n) => n.nodeType === 'text' && n.value && n.value.trim() !== ''
  );
  return texts.length > 0 && texts.every((n) => n.marks && n.marks.some((m) => m.type === 'bold'));
};

// Turns the BOT rich text into [{ year, sections: [{ title, header, rows }] }], newest first.
// - A heading/bold paragraph that is just a year ("2025") starts that year's group.
// - Any other heading/bold paragraph ("EC Members") titles the next table.
// - A table whose header columns are years (Position | 2020 | 2019 ...) is split into one
//   Position | Name table per year.
export const buildBotYears = (description) => {
  const groups = new Map();
  const add = (year, section) => {
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(section);
  };

  let currentYear = null;
  let currentTitle = null;

  (description?.content || []).forEach((node) => {
    if (node.nodeType === BLOCKS.TABLE) {
      const rows = node.content.map((row) => row.content);
      if (!rows.length) return;
      const header = rows[0].map((cell) => extractText(cell).trim());
      const yearCols = header.slice(1);

      if (yearCols.length && yearCols.every((h) => YEAR_RE.test(h))) {
        yearCols.forEach((year, i) => {
          const yearRows = rows
            .slice(1)
            .map((row) => [row[0], row[i + 1]])
            .filter(([, name]) => name && extractText(name).trim() !== '');
          if (yearRows.length) {
            add(year, { title: null, header: [header[0] || 'Position', 'Name'], rows: yearRows });
          }
        });
      } else if (currentYear) {
        add(currentYear, { title: currentTitle, header, rows: rows.slice(1) });
        currentTitle = null;
      }
      return;
    }

    const text = extractText(node).trim();
    if (!text) return;
    if (YEAR_RE.test(text)) {
      currentYear = text;
      currentTitle = null;
    } else if (isSectionTitle(node)) {
      currentTitle = text;
    }
  });

  return [...groups.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, sections]) => ({ year, sections }));
};

const renderCell = (cell) =>
  documentToReactComponents({ nodeType: BLOCKS.DOCUMENT, data: {}, content: cell.content || [] });

const BotAccordion = ({ description }) => {
  const years = useMemo(() => buildBotYears(description), [description]);
  const [openYear, setOpenYear] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const recent = years.filter((y) => Number(y.year) >= MORE_CUTOFF_YEAR);
  const older = years.filter((y) => Number(y.year) < MORE_CUTOFF_YEAR);

  const renderItem = ({ year, sections }) => {
    const isOpen = openYear === year;
    const panelId = `bot-panel-${year}`;
    return (
      <div key={year} className={`bot-accordion-item${isOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="bot-accordion-header"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setOpenYear(isOpen ? null : year)}
        >
          <span>{year}</span>
          <span className="bot-accordion-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div id={panelId} className="bot-accordion-panel">
            {sections.map((section, i) => (
              <div key={i} className="bot-accordion-section">
                {section.title && <h4>{section.title}</h4>}
                <table>
                  <tbody>
                    <tr>
                      {section.header.map((h, j) => (
                        <td key={j}><p>{h}</p></td>
                      ))}
                    </tr>
                    {section.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>{cell ? renderCell(cell) : null}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bot-accordion">
      {recent.map(renderItem)}
      {older.length > 0 && (
        <>
          <button
            type="button"
            className="bot-accordion-more"
            aria-expanded={showMore}
            onClick={() => {
              if (showMore && older.some((y) => y.year === openYear)) setOpenYear(null);
              setShowMore(!showMore);
            }}
          >
            {showMore ? 'Less' : 'More'}
          </button>
          {showMore && older.map(renderItem)}
        </>
      )}
    </div>
  );
};

export default BotAccordion;
