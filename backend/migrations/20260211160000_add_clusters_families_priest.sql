-- ============================================================================
-- MIGRATION: Add Clusters, link SCC to Cluster, Parish priest_id, 
--            and family-level income transactions
-- ============================================================================

-- 1. Create cluster table (collection of SCCs in a geographic area)
CREATE TABLE IF NOT EXISTS cluster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    cluster_code VARCHAR(20) NOT NULL,
    cluster_name VARCHAR(200) NOT NULL,
    location_description TEXT,
    leader_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parish_id, cluster_code)
);

CREATE INDEX IF NOT EXISTS idx_cluster_parish ON cluster(parish_id) WHERE deleted_at IS NULL;

-- 2. Add cluster_id to SCC (an SCC belongs to a cluster)
ALTER TABLE scc ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES cluster(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scc_cluster ON scc(cluster_id) WHERE deleted_at IS NULL;

-- 3. Add priest_id to parish (priest is a member with Holy Orders sacrament)
ALTER TABLE parish ADD COLUMN IF NOT EXISTS priest_id UUID REFERENCES member(id) ON DELETE SET NULL;

-- 4. Add family_id to income_transaction (for family-level collections)
ALTER TABLE income_transaction ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES family(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_income_family ON income_transaction(family_id);

-- 5. Add updated_at trigger for cluster table
CREATE TRIGGER set_cluster_updated_at BEFORE UPDATE ON cluster
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
