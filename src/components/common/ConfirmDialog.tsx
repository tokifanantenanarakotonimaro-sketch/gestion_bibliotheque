import { AlertTriangle, X } from 'lucide-react';

type ConfirmDialogProps = { open: boolean; title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void };

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={onCancel} aria-label="Fermer"><X size={18} /></button><span className="confirm-icon"><AlertTriangle size={21} /></span><h2 id="confirm-title">{title}</h2><p>{message}</p><div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}>Annuler</button><button type="button" className="button button-danger" onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}