import "./ReplyPreview.css";

export default function ReplyPreview({ replyingTo, onClear }) {
  if (!replyingTo) return null;

  return (
    <div className="reply-preview">
      <div className="reply-content">
        <div className="reply-icon">↩️</div>
        <div className="reply-info">
          <div className="reply-to">
            <span className="reply-label">Replying to</span>
            <span className="reply-user">{replyingTo.senderName}</span>
          </div>
          <div className="reply-text">{replyingTo.text}</div>
        </div>
      </div>
      <button className="reply-close" onClick={onClear} title="Cancel reply">
        ✕
      </button>
    </div>
  );
}
