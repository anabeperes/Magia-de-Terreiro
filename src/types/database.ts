export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          role: 'coprodutora' | 'cliente'
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          role: 'coprodutora' | 'cliente'
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          role?: 'coprodutora' | 'cliente'
          created_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nome: string
          cor: string | null
          arquivada: boolean
          criado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cor?: string | null
          arquivada?: boolean
          criado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string | null
          arquivada?: boolean
          criado_por?: string | null
          created_at?: string
        }
      }
      acoes: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          categoria_id: string | null
          status: 'planejada' | 'em_andamento' | 'concluida'
          data_prevista: string | null
          visivel_para_cliente: boolean
          notas_internas: string | null
          criado_por: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          categoria_id?: string | null
          status?: 'planejada' | 'em_andamento' | 'concluida'
          data_prevista?: string | null
          visivel_para_cliente?: boolean
          notas_internas?: string | null
          criado_por: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          categoria_id?: string | null
          status?: 'planejada' | 'em_andamento' | 'concluida'
          data_prevista?: string | null
          visivel_para_cliente?: boolean
          notas_internas?: string | null
          criado_por?: string
          created_at?: string
          updated_at?: string
        }
      }
      acoes_log: {
        Row: {
          id: string
          acao_id: string
          usuario_id: string
          tipo_mudanca: 'criacao' | 'status' | 'edicao'
          descricao: string
          created_at: string
        }
        Insert: {
          id?: string
          acao_id: string
          usuario_id: string
          tipo_mudanca: 'criacao' | 'status' | 'edicao'
          descricao: string
          created_at?: string
        }
        Update: {
          id?: string
          acao_id?: string
          usuario_id?: string
          tipo_mudanca?: 'criacao' | 'status' | 'edicao'
          descricao?: string
          created_at?: string
        }
      }
      acoes_comentarios: {
        Row: {
          id: string
          acao_id: string
          usuario_id: string
          texto: string
          created_at: string
        }
        Insert: {
          id?: string
          acao_id: string
          usuario_id: string
          texto: string
          created_at?: string
        }
        Update: {
          id?: string
          acao_id?: string
          usuario_id?: string
          texto?: string
          created_at?: string
        }
      }
      eventos: {
        Row: {
          id: string
          titulo: string
          tipo: 'lancamento' | 'evento_ao_vivo' | 'subir_criativo' | 'aula_ao_vivo'
          data: string
          descricao: string | null
          criado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          tipo: 'lancamento' | 'evento_ao_vivo' | 'subir_criativo' | 'aula_ao_vivo'
          data: string
          descricao?: string | null
          criado_por: string
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          tipo?: 'lancamento' | 'evento_ao_vivo' | 'subir_criativo' | 'aula_ao_vivo'
          data?: string
          descricao?: string | null
          criado_por?: string
          created_at?: string
        }
      }
    }
  }
}
