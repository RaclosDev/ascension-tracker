import { Camera, Mic, Square } from 'lucide-react';
import type { useAiNutritionChef } from '../../hooks/utilities/useAiNutritionChef';

type Props = Pick<
  ReturnType<typeof useAiNutritionChef>,
  | 'isListening'
  | 'stopListening'
  | 'selectedImage'
  | 'setSelectedImage'
  | 'handleSendMessage'
  | 'fileInputRef'
  | 'handleImageChange'
  | 'toggleListening'
  | 'userInput'
  | 'setUserInput'
  | 'sending'
>;

export function ChefComposer({
  isListening,
  stopListening,
  selectedImage,
  setSelectedImage,
  handleSendMessage,
  fileInputRef,
  handleImageChange,
  toggleListening,
  userInput,
  setUserInput,
  sending,
}: Props) {
  return (
    <>
      {isListening && (
        <div className="flex items-center justify-between text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>
              <strong>Escuchando...</strong> Habla a tu ritmo. Pulsa Listo cuando termines.
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="bg-red-500 text-white rounded-md min-h-11 px-4 text-xs font-semibold cursor-pointer"
          >
            Listo
          </button>
        </div>
      )}

      {selectedImage && (
        <div className="relative inline-block mb-1">
          <img
            src={selectedImage}
            alt="Preview de comida"
            className="h-16 rounded-lg border border-white/20 object-cover"
          />
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute -top-1.5 -right-1.5 bg-black text-white border border-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs before:absolute before:-inset-3"
            title="Quitar foto"
          >
            ✕
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2 items-center pt-2"
      >
        <label htmlFor="ai-chef-file-input" className="sr-only">
          Adjuntar foto de comida
        </label>
        <input
          id="ai-chef-file-input"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          aria-label="Adjuntar foto de comida"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Adjuntar foto de comida"
          className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"
          title="Adjuntar foto de comida"
        >
          <Camera size={18} />
        </button>

        <button
          type="button"
          onClick={() => toggleListening(userInput)}
          aria-label={isListening ? 'Detener dictado por voz' : 'Dictar por voz'}
          className={`w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
            isListening
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-[#1C1C1E] border-white/10 text-white hover:bg-white/10'
          }`}
          title={isListening ? 'Detener dictado' : 'Dictar por voz'}
        >
          {isListening ? <Square size={18} /> : <Mic size={18} />}
        </button>

        <label htmlFor="ai-chef-user-input" className="sr-only">
          Mensaje o petición para el chef nutricional IA
        </label>
        <input
          id="ai-chef-user-input"
          type="text"
          aria-label="Mensaje o petición para el chef nutricional IA"
          className="flex-1 min-w-0 min-h-11 px-3.5 rounded-xl bg-[#1C1C1E] border border-white/10 text-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#0085FF)]"
          placeholder="Pide una receta o sugerencia..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />

        <button
          type="submit"
          disabled={(!userInput.trim() && !selectedImage) || sending}
          aria-label="Enviar mensaje al chef IA"
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            (!userInput.trim() && !selectedImage) || sending
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : 'bg-[var(--accent-primary,#0085FF)] text-white hover:opacity-90 cursor-pointer shadow-md'
          }`}
          title="Enviar mensaje"
        >
          {sending ? (
            <span className="spinner w-3.5 h-3.5 border-2" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </>
  );
}
