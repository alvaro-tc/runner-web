import { arte } from './util'

// MarathonArtwork: la imagen entera, sin recortar; lo que sobra lo llena una
// copia difuminada de si misma. Va de fondo (absoluta) dentro de su hueco.
export default function Arte({ carrera, proporcion, chico, alt = '' }) {
  const url = arte(carrera, proporcion, chico)
  if (!url) return <span className="rn-art is-empty" aria-hidden="true" />
  return (
    <span className="rn-art">
      <span className="rn-art-blur" style={{ backgroundImage: `url("${url}")` }} aria-hidden="true" />
      <img src={url} alt={alt} loading="lazy" />
    </span>
  )
}
