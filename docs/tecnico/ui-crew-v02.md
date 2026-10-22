# UI Crew — alineación V02 + Anexo lámina 02



Referencias:



- `HAVECTRL_V02_Crew.pdf` (v1.1) — funcional y referencias visuales pp. 17–18.

- `HAVECTRL_Anexo_Visual.pdf` — **Lámina 02** Data / Schedule / Experience.



## Layout implementado



| Elemento | Comportamiento |

| --- | --- |

| Hero + tabs | Data · Schedule · Experience (inglés en locale `en`) |

| Directorio izquierdo | Avatar, nombre, ID, cargo, base, estado, alerta licencia, búsqueda y filtros |

| Selección persistente | Al cambiar de pestaña se mantiene trabajador y filtros |

| Data | Cabecera de ficha + acordeones por grupos del Vol. 02 |

| Schedule | Modo Manual/Automatic (UI), mes/agenda, calendario demo, tabla de asignaciones |

| Experience | Resumen de horas + grilla por categoría |



## Grupos Data (Vol. 02 §02–04)



1. Personal Information  

2. Employment & Roles  

3. Licenses & Ratings — edición vía modal de trabajador (licencia y vencimiento)  

4. Medical Certificate — mismo modal (vencimiento médico)  

5. Language Proficiency — registros en `crew.worker_documents` (`category=language`)  

6. Travel Documents — `category=travel`  

7. Training — `category=training`  

8. Other Documents — `category=other`  

9. **Adjuntos** — `POST /files` con `module=crew` y `entityId` = id del trabajador  



## APIs (iteración 1)



| Método | Ruta | Notas |

| --- | --- | --- |

| GET | `/crew/:id` | Incluye `documents[]` y `files[]` |

| POST | `/crew/:id/documents` | Alta de registro por categoría |

| PUT | `/crew/documents/:documentId` | Actualización parcial |

| DELETE | `/crew/documents/:documentId` | Soft delete |

| POST | `/files` | Multipart: `module=crew`, `entityId`, `file` |



Migración tenant: `007_crew_worker_documents.sql` (repo backend).



## Cierre iteración 1A

Ver `/docs/tecnico/crew-cierre-1a.md` (monorepo). **Estado:** cerrado para 1A.

## Pendiente respecto al PDF completo



- Add Position, Add Field, flujo de revisión de documentos, rol automático (pasos 1–5), OCR, PDF export.

- Campos dedicados en BD para cada subtipo (pasaporte vs visa) si el operador lo exige.



## Código



- `src/modules/CrewPage.tsx`

- `src/modules/crew/*`

- Estilos: `.crew-*` en `styles.css`

