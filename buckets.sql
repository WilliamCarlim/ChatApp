
CREATE POLICY "Avatares são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');


CREATE POLICY "Usuários autenticados podem fazer upload de avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
);


CREATE POLICY "Usuários podem atualizar seus próprios avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
);


CREATE POLICY "Usuários podem deletar seus próprios avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Permitir upload de áudio" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'mensagens-audio' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir acesso público aos áudios" ON storage.objects FOR SELECT USING (
  bucket_id = 'mensagens-audio'
);

   CREATE POLICY "Permitir upload de imagens" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'mensagens-imagens' AND
     auth.role() = 'authenticated'
   );

   CREATE POLICY "Permitir acesso público às imagens" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'mensagens-imagens'
   );

CREATE POLICY "Permitir deleção de imagens pelo remetente" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mensagens-imagens' AND
  EXISTS (
    SELECT 1 FROM msg_chat m
    WHERE m.imagem_url LIKE '%' || name AND
    m.remetente_id = auth.uid()
  )
);

CREATE POLICY "Permitir deleção de áudios pelo remetente" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mensagens-audio' AND
  EXISTS (
    SELECT 1 FROM msg_chat m
    WHERE m.audio_url LIKE '%' || name AND
    m.remetente_id = auth.uid()
  )
);

CREATE POLICY "Permitir upload de vídeos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mensagens-videos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir acesso público aos vídeos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'mensagens-videos'
);

CREATE POLICY "Permitir deleção de vídeos pelo remetente" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mensagens-videos' AND
  EXISTS (
    SELECT 1 FROM msg_chat m
    WHERE m.video_url LIKE '%' || name AND
    m.remetente_id = auth.uid()
  )
);

CREATE POLICY "Permitir upload de documentos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mensagens-documentos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Permitir acesso público aos documentos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'mensagens-documentos'
);

CREATE POLICY "Permitir deleção de documentos pelo remetente" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mensagens-documentos' AND
  EXISTS (
    SELECT 1 FROM msg_chat m
    WHERE m.documento_url LIKE '%' || name AND
    m.remetente_id = auth.uid()
  )
);