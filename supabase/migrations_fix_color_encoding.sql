-- iMarket: corrige 6 colores que quedaron con codificación dañada (mojibake)
-- al pegar la migración de colores en el editor SQL.
-- Se identifican por modelo + posición para no depender de la cadena dañada.
-- Ejecutar una sola vez en el SQL Editor de Supabase (como postgres, omite RLS).

update public.iphone_colors set color = 'Azul pacífico'
 where model in ('iPhone 12 Pro', 'iPhone 12 Pro Max') and position = 4;

update public.iphone_colors set color = 'Naranja cósmico'
 where model in ('iPhone 17 Pro', 'iPhone 17 Pro Max') and position = 2;

update public.iphone_colors set color = 'Borgoña'
 where model in ('iPhone 18 Pro', 'iPhone 18 Pro Max') and position = 4;

-- Verificación: no debe devolver filas (el mojibake siempre contiene 'Ã').
select model, color from public.iphone_colors
 where color like '%Ã%';
