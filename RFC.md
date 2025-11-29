# RFC: JPACKED Data Format Specification

**Versión:** 1.1  
**Fecha:** 2024  
**Estado:** Propuesta

## 1. Resumen

JPACKED es un formato de serialización de datos compacto y eficiente, diseñado como alternativa a JSON para casos de uso donde se requiere transferir grandes volúmenes de datos estructurados de forma repetitiva. El formato combina un esquema declarativo con codificación CSV para minimizar el tamaño de los datos transmitidos.

## 2. Motivación

### 2.1 Problemas con JSON

JSON, aunque ampliamente adoptado, presenta limitaciones en escenarios específicos:

1. **Redundancia estructural**: Cada objeto repite los nombres de las propiedades
2. **Overhead de sintaxis**: Llaves, comillas y comas añaden peso innecesario
3. **Metadatos externos**: La paginación y conteos requieren wrappers adicionales
4. **Compresión limitada**: La estructura repetitiva no se comprime tan eficientemente

### 2.2 Objetivos de JPACKED

- Reducir el tamaño de los datos transmitidos en 30-60%
- Mejorar el rendimiento de parsing en estructuras repetitivas
- Integrar metadatos de forma nativa
- Mantener simplicidad y legibilidad
- Proporcionar tipado fuerte con TypeScript

## 3. Definición Formal

### 3.1 Estructura General

Un documento JPACKED consiste en las siguientes secciones, en orden:

1. **Header de versión** (obligatorio)
2. **Línea de metadatos** (obligatorio)
3. **Línea de esquema** (obligatorio)
4. **Marcador de datos** (obligatorio)
5. **Filas de datos** (opcional, puede estar vacío)

### 3.2 BNF del Formato

```
<jpacked-document> ::= <version-header> <newline>
                     <metadata-line> <newline>
                     <schema-line> <newline>
                     <data-marker> <newline>
                     <data-rows>?

<version-header> ::= "JPACKED/" <version-number>
<version-number> ::= "1.1"

<metadata-line> ::= "meta[" <count> "]" 
                    [ "[" <page> "]" 
                      [ "[" <page-count> "]" 
                        [ "[" <total> "]" ]? ]? ]?

<count> ::= <digit>+
<page> ::= <digit>+
<page-count> ::= <digit>+
<total> ::= <digit>+

<schema-line> ::= "schema{" <field-list> "}"
<field-list> ::= <field> [ "," <field> ]*
<field> ::= <field-name> [ "[]" ]?
<field-name> ::= <identifier>

<data-marker> ::= "data"

<data-rows> ::= <csv-row> [ <newline> <csv-row> ]*
<csv-row> ::= <csv-value> [ "," <csv-value> ]*

<csv-value> ::= <simple-value> | <quoted-value>
<simple-value> ::= [^,"\n\r]*
<quoted-value> ::= '"' <quoted-content> '"'
<quoted-content> ::= ( [^"] | '""' )*

<array-value> ::= <array-item> [ "|" <array-item> ]*
<array-item> ::= ( [^\|\\] | <escape-sequence> )*
<escape-sequence> ::= "\\" ( "|" | "\\" )

<newline> ::= "\n" | "\r\n"
<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
<identifier> ::= [a-zA-Z_][a-zA-Z0-9_]*
```

## 4. Especificación de Componentes

### 4.1 Header de Versión

**Formato:** `JPACKED/<version>`

**Versión actual:** `1.1`

El header de versión debe ser la primera línea del documento. Permite a los parsers identificar el formato y la versión del estándar.

**Ejemplo:**
```
JPACKED/1.1
```

### 4.2 Línea de Metadatos

**Formato:** `meta[COUNT][PAGE?][PAGE_COUNT?][TOTAL?]`

**Reglas:**
- `COUNT` es obligatorio y representa el número de filas de datos
- `PAGE` es opcional y representa el número de página actual
- `PAGE_COUNT` es opcional y representa el total de páginas
- `TOTAL` es opcional y representa el total de registros disponibles

**Orden:** Los campos opcionales deben aparecer en orden: count, page, pageCount, total. No se pueden omitir campos intermedios.

**Ejemplos válidos:**
```
meta[20]
meta[20][1]
meta[20][1][5]
meta[20][1][5][200]
```

**Ejemplos inválidos:**
```
meta[20][][5]        // No se puede omitir page
meta[20][1][][200]   // No se puede omitir pageCount
```

### 4.3 Línea de Esquema

**Formato:** `schema{field1,field2,arrayField[],...}`

**Reglas:**
- Define los nombres de los campos en orden
- Los campos de tipo array se marcan con `[]` después del nombre
- Los nombres de campos deben ser identificadores válidos (letras, números, guiones bajos)
- El orden de los campos define el orden de las columnas en las filas CSV

**Ejemplos:**
```
schema{id,name,email}
schema{id,name,tags[],active}
schema{userId,userName,permissions[],createdAt,isActive}
```

### 4.4 Marcador de Datos

**Formato:** `data`

Marca el inicio de la sección de datos. Debe aparecer después del esquema y antes de las filas CSV.

### 4.5 Filas de Datos

Cada fila después del marcador `data` es una línea CSV que representa un registro. Los valores deben corresponder al esquema definido en orden.

**Reglas CSV:**
- Las comas separan columnas
- Los valores que contienen comas, saltos de línea o comillas deben encerrarse en comillas dobles
- Las comillas internas se duplican: `"` → `""`
- Los valores vacíos se representan como campos vacíos (sin comillas)

**Ejemplos:**
```
1,Alice,alice@example.com
2,"Bob, Jr.",bob@example.com
3,Charlie,"He said ""Hello"""
```

## 5. Codificación de Arrays

### 5.1 Formato

Los arrays se codifican como strings donde:
- Los elementos se separan con el carácter `|` (pipe)
- Los caracteres especiales se escapan con backslash `\`

### 5.2 Reglas de Escape

| Carácter | Escape | Descripción |
|----------|--------|-------------|
| `\|` | `\\|` | Pipe literal |
| `\` | `\\\\` | Backslash literal |

### 5.3 Ejemplos

**Valor real:**
```typescript
["tag1", "tag2", "tag3"]
```

**Codificación:**
```
tag1|tag2|tag3
```

**Valor real:**
```typescript
["a|b", "c\\d"]
```

**Codificación:**
```
a\|b|c\\d
```

**Valor real:**
```typescript
["simple", "with|pipe", "with\\backslash"]
```

**Codificación:**
```
simple|with\|pipe|with\\backslash
```

### 5.4 Decodificación

El proceso de decodificación debe:
1. Leer el string de izquierda a derecha
2. Detectar escapes `\` seguidos de `|` o `\`
3. Reconstruir los elementos del array
4. Manejar arrays vacíos como string vacío

## 6. Tipos de Datos

### 6.1 Tipos Soportados

JPACKED soporta los siguientes tipos de datos:

| Tipo | Codificación | Ejemplo |
|------|--------------|---------|
| String | Directo o CSV quoted | `hello` o `"hello, world"` |
| Number | String numérico | `123`, `45.67`, `-10` |
| Boolean | `true` o `false` | `true`, `false` |
| Null | Campo vacío | `` (vacío) |
| Array | Array encoding | `item1\|item2\|item3` |

### 6.2 Conversión de Tipos

Durante la decodificación:
- Strings numéricos se convierten a números si es posible
- `"true"` y `"false"` se convierten a booleanos
- Campos vacíos se interpretan como `null`
- Arrays se decodifican como arrays de strings (con conversión numérica si aplica)

## 7. Seguridad

### 7.1 Validación de Entrada

Los parsers deben validar:
- Header de versión correcto
- Formato de metadatos válido
- Formato de esquema válido
- Número de columnas en cada fila coincida con el esquema
- Valores numéricos dentro de rangos válidos

### 7.2 Manejo de Errores

Los parsers deben:
- Rechazar documentos con formato inválido
- Proporcionar mensajes de error descriptivos
- No procesar parcialmente documentos inválidos

### 7.3 Limitaciones

- Tamaño máximo recomendado: 10MB por documento
- Número máximo de columnas: 1000
- Longitud máxima de campo: 1MB

## 8. Versionado

### 8.1 Estrategia de Versionado

JPACKED usa versionado semántico en el header: `JPACKED/MAJOR.MINOR`

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nuevas características compatibles hacia atrás

### 8.2 Compatibilidad

Los parsers deben:
- Rechazar versiones mayores no soportadas
- Aceptar versiones menores iguales o menores a la soportada
- Proporcionar mensajes claros sobre versiones no soportadas

### 8.3 Versión Actual

**Versión 1.1** - Versión inicial del estándar

## 9. Ejemplos Completos

### 9.1 Ejemplo Básico

```
JPACK/1.1
meta[2]
schema{id,name,age}
data
1,Alice,30
2,Bob,25
```

### 9.2 Ejemplo con Arrays

```
JPACK/1.1
meta[2]
schema{id,name,tags[]}
data
1,Alice,admin|user|moderator
2,Bob,user
```

### 9.3 Ejemplo con Metadatos Completos

```
JPACK/1.1
meta[20][1][5][200]
schema{id,name,email,active}
data
1,Alice,alice@example.com,true
2,Bob,bob@example.com,true
...
```

### 9.4 Ejemplo con Caracteres Especiales

```
JPACKED/1.1
meta[1]
schema{id,name,description}
data
1,"John, Doe","He said ""Hello"" and left"
```

## 10. Implementación de Referencia

La implementación de referencia está disponible en el paquete NPM `jpacked` y proporciona:
- Encoder y decoder completos
- Validación de formato
- Middlewares para Express y Fetch
- Tipos TypeScript completos
- Suite de tests exhaustiva

## 11. Referencias

- [RFC 4180 - Common Format and MIME Type for Comma-Separated Values (CSV) Files](https://tools.ietf.org/html/rfc4180)
- [ECMA-404 - The JSON Data Interchange Standard](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 12. Historial de Versiones

- **1.1** (2024): Versión inicial del estándar

---

**Nota:** Este RFC es un documento vivo y puede ser actualizado. Las versiones futuras del estándar se documentarán en este documento.

