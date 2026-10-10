# Seguridad

El gestor ejecuta código elegido por la persona. No analiza automáticamente si ese código es confiable. Los permisos de sitios determinan dónde se inyecta un script; no limitan todos los destinos de red que el script puede utilizar desde una página.

Los scripts se ejecutan en el contexto principal del sitio para conservar compatibilidad con su JavaScript. La página puede interactuar con ellos. No hay una barrera de aislamiento entre la página y el script.

El almacenamiento de scripts se limita a los contextos de confianza de la extensión mediante `setAccessLevel`. Se usan permisos opcionales y se retiran los sitios que dejan de ser necesarios al desactivar o eliminar scripts.

La política de contenido del gestor bloquea conexiones de red en sus propios contextos mediante `connect-src 'none'` y permite cargar únicamente su código empaquetado. Esta restricción no se aplica al código de los userscripts que se ejecuta en las páginas visitadas.

Para informar una vulnerabilidad, usa la opción de reporte privado de la sección Security de GitHub cuando esté disponible. No adjuntes datos de páginas reales, credenciales ni scripts privados a un issue público. Un reporte útil contiene la versión del gestor, los pasos de reproducción y un script de ejemplo con datos ficticios.

Se mantienen las correcciones en la versión más reciente. Las revisiones y pruebas no constituyen una garantía de seguridad absoluta.
