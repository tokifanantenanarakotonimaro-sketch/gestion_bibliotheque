import { BookPlus, ImagePlus, Save, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Book, BookStatus } from '../../types/library';

type BookFormData = Pick<Book, 'title' | 'author' | 'category' | 'status' | 'coverImage'>;

type BookModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (book: BookFormData) => void;
  initialData?: Book | null;
};

const categories = [
  'Roman',
  'Science-fiction',
  'Classique',
  'Philosophie',
  'Histoire',
  'Poésie',
  'Thriller & Policier',
  'Biographie',
  'Jeunesse',
  'Essai',
];

export function BookModal({ open, onClose, onSubmit, initialData }: BookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [status, setStatus] = useState<BookStatus>('Disponible');
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '');
      setAuthor(initialData?.author ?? '');
      setCategory(initialData?.category ?? categories[0]);
      setStatus(initialData?.status ?? 'Disponible');
      setCoverImage(initialData?.coverImage ?? '');
      setError('');
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError('Le titre et l’auteur sont obligatoires.');
      return;
    }

    onSubmit({
      title: title.trim(),
      author: author.trim(),
      category,
      status,
      coverImage: coverImage || undefined,
    });
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(typeof reader.result === 'string' ? reader.result : '');
      setError('');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="book-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div className="modal-heading-copy">
            <span className="modal-icon"><BookPlus size={17} /></span>
            <div>
              <h2 id="add-book-title">{initialData ? 'Modifier le livre' : 'Ajouter un livre'}</h2>
              <p>{initialData ? 'Mettez à jour les informations de l’ouvrage.' : 'Ajoutez un nouvel ouvrage au catalogue.'}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="book-form">
          {error && <p className="form-error" role="alert">{error}</p>}
          <label>
            Titre <span>*</span>
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex. Le Petit Prince" autoFocus />
          </label>
          <label>
            Auteur <span>*</span>
            <input value={author} onChange={event => setAuthor(event.target.value)} placeholder="Ex. Antoine de Saint-Exupéry" />
          </label>
          <div className="book-form-grid">
            <label>
              Catégorie
              <select value={category} onChange={event => setCategory(event.target.value)}>
                {categories.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Disponibilité
              <select value={status} onChange={event => setStatus(event.target.value as BookStatus)}>
                <option value="Disponible">Disponible</option>
                <option value="Emprunté">Emprunté</option>
              </select>
            </label>
          </div>
          <label className="cover-upload">
            Photo de couverture
            <span className="cover-upload-control">
              <ImagePlus size={16} />
              <span>{coverImage ? 'Photo sélectionnée' : 'Choisir une photo depuis le PC'}</span>
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </span>
            <small>Formats image acceptés, 5 Mo maximum.</small>
          </label>
          {coverImage && <img className="cover-preview" src={coverImage} alt="Aperçu de la couverture" />}
          <div className="modal-actions">
            <button type="button" className="button button-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="button button-primary"><Save size={15} />{initialData ? 'Enregistrer' : 'Ajouter au catalogue'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}