import React from 'react';
import PropTypes from 'prop-types';

const Comment = ({ text, theme, likes, dislikes, score }) => {
  return (
    <div className="card my-3">
      <div className="card-header">
        <h5>{theme}</h5>
      </div>
      <div className="card-body">
        <p className="card-text">{text}</p>
        <div className="d-flex justify-content-between">
          <div>
            <button type="button" className="btn btn-success me-2">
              👍 {likes}
            </button>
            <button type="button" className="btn btn-danger">
              👎 {dislikes}
            </button>
          </div>
          <div>
            <span className={`badge ${score > 0 ? 'bg-success' : score < 0 ? 'bg-danger' : 'bg-secondary'}`}>
              {score > 0 ? 'Positivo' : score < 0 ? 'Negativo' : 'Neutro'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

Comment.propTypes = {
  text: PropTypes.string.isRequired,
  theme: PropTypes.string.isRequired,
  likes: PropTypes.number.isRequired,
  dislikes: PropTypes.number.isRequired,
  score: PropTypes.number.isRequired,
};

export default Comment;
