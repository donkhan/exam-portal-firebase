const QuotePanel = ({ quote }) => {
  if (!quote) return null;

  return (
    <div className="quote-panel">
      <span className="quote-text">
        “{quote.quote}”
      </span>
      <span className="quote-author">
        — {quote.author}
      </span>
    </div>
  );
};

export default QuotePanel;
