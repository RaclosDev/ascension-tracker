import Wordmark from './Wordmark';

export default function LandingFooter() {
  return (
    <footer className="fam-container">
      <div className="fam-footer">
        <span className="fam-brand">
          <Wordmark />
        </span>
        <p className="fam-footer__links">
          <span>Código abierto, licencia MIT.</span>
          <a href="/privacidad" className="fam-link">
            Privacidad
          </a>
          <a href="/terminos" className="fam-link">
            Términos
          </a>
          <a href="https://github.com/RaclosDev/ascension-tracker" className="fam-link">
            Ver el código en GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
