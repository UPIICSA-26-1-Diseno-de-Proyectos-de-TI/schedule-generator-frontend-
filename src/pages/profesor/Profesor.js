
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Comment from './components/Comment';


import {
  useParams
} from 'react-router-dom';

const Profesor = () => {
  const { name } = useParams(); 
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
      try {
        const response = await axios.get(`${apiEndpoint}/teachers/`, {
          params: { teacher_name: name }
        });
        setComments(response.data.comments);
      } catch (err) {
        setError('No hay comentarios sobre el ' + name);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  if (loading) {
    return <div className="container mt-5"><p>Cargando comentarios...</p></div>;
  }

  if (error) {
    return <div className="container mt-5"><p>Error al cargar comentarios: {error}</p></div>;
  }

  return (
    <div className="container mt-5">
      <h1>Comentarios sobre {name}</h1>
      {comments.map((comment, index) => (
        <Comment
          key={index}
          text={comment.text}
          theme={comment.subject}
          likes={comment.likes}
          dislikes={comment.dislikes}
          score={comment.positive_score > 0.5 ? 1 : comment.negative_score > 0.5 ? -1 : 0}
        />
      ))}
    </div>
  );
}

export default Profesor;