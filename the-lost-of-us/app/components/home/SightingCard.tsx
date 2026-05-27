"use client";

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import styles from "./SightingCard.module.css";
import CreateSightingModal from "./CreateSightingModal";
import {
  CommentApiResponse,
  createSighting,
  createComment,
  deleteComment,
  getComments,
  getSightingsByPost,
  type SightingApiResponse,
  // reportComment,
  updateComment,
  voteComment,
} from "@/lib/apiClient";
import { formatRelativeTime } from "@/lib/date";
import { formatLocationDisplay, type LocationCoordinates, type LocationWithLabel } from "@/lib/location";

interface SightingCardProps {
  postId: string;
  postUserSub?: string;
  imageSrc: string | string[];
  imageAlt: string;
  name: string;
  authorName?: string;
  description?: string;
  location: string;
  date: string;
  status: string;
  rawLastSeenDate?: string | Date | null;
  allowCommentActions?: boolean;
  initialSightingLocation?: LocationCoordinates | null;
}

type CommentItemProps = {
  comment: CommentApiResponse;
  depth?: number;
  activeReplyTo: string | null;
  activeEditId: string | null;
  replyText: string;
  editText: string;
  onReplyStart: (commentId: string) => void;
  onReplyCancel: () => void;
  onReplyTextChange: (value: string) => void;
  onReplySubmit: (parentCommentId: string) => Promise<void>;
  onEditStart: (comment: CommentApiResponse) => void;
  onEditCancel: () => void;
  onEditTextChange: (value: string) => void;
  onEditSubmit: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onVote: (commentId: string, value: 1 | -1) => Promise<void>;
  allowCommentActions: boolean;
  // onReport: (commentId: string) => Promise<void>;
};

type SightingItemProps = {
  sighting: SightingApiResponse;
};

function CommentItem({
  comment,
  depth = 0,
  activeReplyTo,
  activeEditId,
  replyText,
  editText,
  onReplyStart,
  onReplyCancel,
  onReplyTextChange,
  onReplySubmit,
  onEditStart,
  onEditCancel,
  onEditTextChange,
  onEditSubmit,
  onDelete,
  onVote,
  allowCommentActions,
}: CommentItemProps) {
  const isEditing = activeEditId === comment.id;
  const isReplying = activeReplyTo === comment.id;

  return (
    <div className={styles.commentItem} style={{ marginLeft: depth > 0 ? 18 : 0 }}>
      <div className={styles.commentHeader}>
        <strong>{comment.authorName}</strong>
        <span className={styles.commentMeta}>• {formatRelativeTime(comment.createdAt)}</span>
        {comment.updatedAt && new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime() && (
          <span className={styles.commentMeta}>(editado)</span>
        )}
      </div>

      {allowCommentActions && isEditing ? (
        <div className={styles.commentFormInline}>
          <textarea
            value={editText}
            onChange={(event) => onEditTextChange(event.target.value)}
            className={styles.commentTextarea}
            placeholder="Edite seu comentário"
          />
          <div className={styles.commentActionsRow}>
            <button className={styles.smallPrimaryButton} onClick={() => onEditSubmit(comment.id)}>Salvar</button>
            <button className={styles.smallSecondaryButton} onClick={onEditCancel}>Cancelar</button>
          </div>
        </div>
      ) : (
        <p className={styles.commentText}>{comment.commentText}</p>
      )}

      {allowCommentActions && (
        <div className={styles.commentToolbar}>
          <button
            className={comment.userVote === 1 ? styles.activeVoteButton : styles.voteButton}
            onClick={() => onVote(comment.id, 1)}
          >
            👍 {comment.likesCount}
          </button>
          <button
            className={comment.userVote === -1 ? styles.activeVoteButton : styles.voteButton}
            onClick={() => onVote(comment.id, -1)}
          >
            👎 {comment.dislikesCount}
          </button>
          <button className={styles.textButton} onClick={() => onReplyStart(comment.id)}>Responder</button>
          {comment.canEdit && <button className={styles.textButton} onClick={() => onEditStart(comment)}>Editar</button>}
          {comment.canDelete && <button className={styles.textButtonDanger} onClick={() => onDelete(comment.id)}>Excluir</button>}
          {/* Denúncia de comentário desativada por enquanto. */}
          {/* <button className={styles.textButton} onClick={() => onReport(comment.id)}>Denunciar</button> */}
        </div>
      )}

      {allowCommentActions && isReplying && (
        <div className={styles.commentFormInline}>
          <textarea
            value={replyText}
            onChange={(event) => onReplyTextChange(event.target.value)}
            className={styles.commentTextarea}
            placeholder="Escreva sua resposta"
          />
          <div className={styles.commentActionsRow}>
            <button className={styles.smallPrimaryButton} onClick={() => onReplySubmit(comment.id)}>Responder</button>
            <button className={styles.smallSecondaryButton} onClick={onReplyCancel}>Cancelar</button>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className={styles.replyList}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              activeReplyTo={activeReplyTo}
              activeEditId={activeEditId}
              replyText={replyText}
              editText={editText}
              onReplyStart={onReplyStart}
              onReplyCancel={onReplyCancel}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditTextChange={onEditTextChange}
              onEditSubmit={onEditSubmit}
              onDelete={onDelete}
              onVote={onVote}
              allowCommentActions={allowCommentActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SightingItem({ sighting }: SightingItemProps) {
  const location =
    sighting.location_latitude != null && sighting.location_longitude != null
      ? {
          latitude: sighting.location_latitude,
          longitude: sighting.location_longitude,
          label: sighting.locationLabel ?? null,
        }
      : null;

  return (
    <div className={styles.sightingItem}>
      <div className={styles.sightingHeader}>
        <strong>{sighting.authorName || "Autor desconhecido"}</strong>
        <span className={styles.sightingMeta}>• {formatRelativeTime(sighting.reported_at)}</span>
      </div>
      {sighting.description?.trim() ? (
        <p className={styles.sightingBody}>{sighting.description}</p>
      ) : (
        <p className={styles.sightingEmpty}>Sem descrição.</p>
      )}
      <p className={styles.sightingLocation}>{formatLocationDisplay(location as LocationWithLabel | null)}</p>
    </div>
  );
}

const SightingCard = ({
  postId,
  postUserSub,
  imageSrc,
  imageAlt,
  name,
  authorName,
  description,
  location,
  date,
  status,
  allowCommentActions = true,
  initialSightingLocation = null,
}: SightingCardProps) => {
  const { isSignedIn, userId } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<CommentApiResponse[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState("");
  const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [sightings, setSightings] = useState<SightingApiResponse[]>([]);
  const [sightingsOpen, setSightingsOpen] = useState(false);
  const [loadingSightings, setLoadingSightings] = useState(false);
  const [sightingsError, setSightingsError] = useState<string | null>(null);
  const [sightingOpen, setSightingOpen] = useState(false);
  const [sightingSaving, setSightingSaving] = useState(false);
  const [sightingError, setSightingError] = useState<string | null>(null);
  const images = Array.isArray(imageSrc) ? imageSrc : [imageSrc];
  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const loadComments = async () => {
    setLoadingComments(true);
    setCommentError(null);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch {
      setCommentError("Erro ao carregar comentários.");
    } finally {
      setLoadingComments(false);
    }
  };

  const loadSightings = async () => {
    setLoadingSightings(true);
    setSightingsError(null);

    try {
      const data = await getSightingsByPost(postId);
      setSightings(data);
    } catch {
      setSightingsError("Erro ao carregar avistamentos.");
    } finally {
      setLoadingSightings(false);
    }
  };

  useEffect(() => {
    if (commentsOpen) {
      loadComments();
    }
  }, [commentsOpen, postId]);

  useEffect(() => {
    if (sightingsOpen) {
      loadSightings();
    }
  }, [sightingsOpen, postId]);

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleCreateComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    try {
      await createComment({ postId, commentText: text });
      setCommentText("");
      await loadComments();
    } catch {
      setCommentError("Não foi possível comentar.");
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    const text = replyText.trim();
    if (!text) return;

    try {
      await createComment({ postId, parentCommentId, commentText: text });
      setReplyText("");
      setActiveReplyTo(null);
      await loadComments();
    } catch {
      setCommentError("Não foi possível responder esse comentário.");
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    const text = editText.trim();
    if (!text) return;

    try {
      await updateComment({ commentId, commentText: text });
      setEditText("");
      setActiveEditId(null);
      await loadComments();
    } catch {
      setCommentError("Não foi possível editar esse comentário.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch {
      setCommentError("Não foi possível excluir esse comentário.");
    }
  };

  const handleVoteComment = async (commentId: string, value: 1 | -1) => {
    try {
      await voteComment({ commentId, value });
      await loadComments();
    } catch {
      setCommentError("Não foi possível registrar seu voto.");
    }
  };

  const handleCreateSighting = async (payload: { description: string | null; location: LocationCoordinates }) => {
    setSightingSaving(true);
    setSightingError(null);

    try {
      await createSighting({
        postId,
        description: payload.description,
        location: payload.location,
      });
      setSightingOpen(false);
    } catch {
      setSightingError("Não foi possível registrar o avistamento.");
    } finally {
      setSightingSaving(false);
    }
  };

  // Denúncia de comentário desativada por enquanto.
  // const handleReportComment = async (commentId: string) => {
  //   try {
  //     const result = await reportComment({ commentId });
  //     if (result.deleted) {
  //       setCommentError("Comentário removido automaticamente após atingir o limite de denúncias.");
  //     }
  //     await loadComments();
  //   } catch {
  //     setCommentError("Não foi possível denunciar esse comentário.");
  //   }
  // };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={currentImage}
          alt={imageAlt}
          width={198}
          height={135}
          className={styles.image}
        />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className={`${styles.carouselButton} ${styles.carouselLeft}`}
              aria-label="Imagem anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={`${styles.carouselButton} ${styles.carouselRight}`}
              aria-label="Próxima imagem"
            >
              ›
            </button>
            <div className={styles.carouselCounter}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        <div className={styles.badges}>
          <span className={styles.statusBadge}>{status}</span>
        </div>
      </div>

      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.author}>Publicado por {authorName || "Autor desconhecido"}</p>
      </header>

      <section className={styles.keyInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Data do Último avistamento</span>
          <span className={styles.infoValue}>{date}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Localização do Último Avistamento</span>
          <span className={styles.infoValue}>{location}</span>
        </div>
      </section>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.sightingActions}>
        <button
          type="button"
          className={styles.sightingButton}
          onClick={() => setSightingOpen(true)}
          disabled={!!(!isSignedIn || (userId && postUserSub && userId === postUserSub))}
        >
          Registrar avistamento
        </button>
        {!isSignedIn && (
          <p className={styles.sightingHint}>Faça login para registrar um avistamento.</p>
        )}
        {isSignedIn && userId && postUserSub && userId === postUserSub && (
          <p className={styles.sightingHint} style={{ color: '#b42318', fontWeight: 600 }}>
            Você não pode registrar avistamento no seu próprio post.
          </p>
        )}
      </div>

      <CreateSightingModal
        open={sightingOpen}
        petName={name}
        initialLocation={initialSightingLocation}
        saving={sightingSaving}
        errorMessage={sightingError ?? undefined}
        onClose={() => {
          setSightingOpen(false);
          setSightingError(null);
        }}
        onSave={handleCreateSighting}
      />

      <div className={styles.sightingsBlock}>
        <div className={styles.commentsHeader}>
          <strong>Avistamentos</strong>
          <button className={styles.commentsToggle} onClick={() => setSightingsOpen((prev) => !prev)}>
            {sightingsOpen ? "Ocultar" : "Abrir"}
          </button>
        </div>

        {sightingsOpen && (
          <>
            {sightingsError && <p className={styles.commentError}>{sightingsError}</p>}
            {loadingSightings ? (
              <p className={styles.commentInfo}>Carregando avistamentos...</p>
            ) : sightings.length === 0 ? (
              <p className={styles.sightingEmpty}>Ainda não há avistamentos.</p>
            ) : (
              <div className={styles.sightingsList}>
                {sightings.map((sighting) => (
                  <SightingItem key={sighting.id} sighting={sighting} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.commentsBlock}>
        <div className={styles.commentsHeader}>
          <strong>Comentários</strong>
          <button className={styles.commentsToggle} onClick={() => setCommentsOpen((prev) => !prev)}>
            {commentsOpen ? "Ocultar" : "Abrir"}
          </button>
        </div>

        {commentsOpen && (
          <>
            {allowCommentActions && isSignedIn && (
              <div className={styles.commentComposer}>
                <textarea
                  className={styles.commentTextarea}
                  placeholder="Escreva um comentário"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
                <button className={styles.primaryButton} onClick={handleCreateComment}>Comentar</button>
              </div>
            )}

            {commentError && <p className={styles.commentError}>{commentError}</p>}
            {loadingComments ? (
              <p className={styles.commentInfo}>Carregando comentários...</p>
            ) : comments.length === 0 ? (
              <p className={styles.commentInfo}>Ainda não há comentários.</p>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    activeReplyTo={activeReplyTo}
                    activeEditId={activeEditId}
                    replyText={replyText}
                    editText={editText}
                    onReplyStart={(commentId) => {
                      setActiveEditId(null);
                      setEditText("");
                      setActiveReplyTo(commentId);
                    }}
                    onReplyCancel={() => {
                      setActiveReplyTo(null);
                      setReplyText("");
                    }}
                    onReplyTextChange={setReplyText}
                    onReplySubmit={handleReplySubmit}
                    onEditStart={(comment) => {
                      setActiveReplyTo(null);
                      setReplyText("");
                      setActiveEditId(comment.id);
                      setEditText(comment.commentText);
                    }}
                    onEditCancel={() => {
                      setActiveEditId(null);
                      setEditText("");
                    }}
                    onEditTextChange={setEditText}
                    onEditSubmit={handleEditSubmit}
                    onDelete={handleDeleteComment}
                    onVote={handleVoteComment}
                    allowCommentActions={allowCommentActions}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className={styles.footerHint}>Compartilhe esta ocorrência para ampliar a busca.</p>
    </article>
  );
}

export default SightingCard;