-- Enable read access to clientes table
CREATE POLICY "Allow public read access to clientes"
ON public.clientes
FOR SELECT
USING (true);

-- Enable update access to clientes for stage changes
CREATE POLICY "Allow public update access to clientes"
ON public.clientes
FOR UPDATE
USING (true);

-- Enable read access to conversas table
CREATE POLICY "Allow public read access to conversas"
ON public.conversas
FOR SELECT
USING (true);

-- Enable read access to mensagens table
CREATE POLICY "Allow public read access to mensagens"
ON public.mensagens
FOR SELECT
USING (true);

-- Enable read access to appointments table
CREATE POLICY "Allow public read access to appointments"
ON public.appointments
FOR SELECT
USING (true);

-- Enable read access to pipeline_events
CREATE POLICY "Allow public read access to pipeline_events"
ON public.pipeline_events
FOR SELECT
USING (true);

-- Enable insert access to pipeline_events
CREATE POLICY "Allow public insert access to pipeline_events"
ON public.pipeline_events
FOR INSERT
WITH CHECK (true);

-- Enable read access to doctors
CREATE POLICY "Allow public read access to doctors"
ON public.doctors
FOR SELECT
USING (true);

-- Enable read access to followups
CREATE POLICY "Allow public read access to followups"
ON public.followups
FOR SELECT
USING (true);

-- Enable read access to interesses
CREATE POLICY "Allow public read access to interesses"
ON public.interesses
FOR SELECT
USING (true);