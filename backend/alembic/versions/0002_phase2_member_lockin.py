"""Phase 2: Add user, company_info, template, payment_history tables and modify quote table"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '0002_phase2_member_lockin'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ENUM types already exist in DB (created manually), skip CREATE TYPE
    # Create user table using plan_type enum via String with check constraint
    op.create_table(
        'user',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('company_name', sa.String(100), nullable=True),
        sa.Column('ceo_name', sa.String(50), nullable=True),
        sa.Column('biz_reg_no', sa.String(10), nullable=True, unique=True),
        sa.Column('company_address', JSONB, nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('plan', sa.String(20), nullable=False, server_default='FREE'),
        sa.Column('quote_seq', sa.Integer, nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('email_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    # Add check constraint for plan
    op.execute("ALTER TABLE \"user\" ADD CONSTRAINT chk_user_plan CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE'))")
    
    # Create company_info table
    op.create_table(
        'company_info',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('biz_reg_no', sa.String(10), nullable=False),
        sa.Column('company_name', sa.String(100), nullable=False),
        sa.Column('ceo_name', sa.String(50), nullable=False),
        sa.Column('address', sa.String(255), nullable=False),
        sa.Column('business_type', sa.String(50), nullable=True),
        sa.Column('business_item', sa.String(50), nullable=True),
        sa.Column('phone', sa.String(15), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('bank_info', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    
    # Create template table
    op.create_table(
        'template',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('items', JSONB, nullable=False, default=list),
        sa.Column('calculation_snapshot', JSONB, nullable=False, default=dict),
        sa.Column('is_public', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('usage_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    
    # Create payment_history table
    op.create_table(
        'payment_history',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan', sa.String(20), nullable=False),
        sa.Column('amount', sa.Integer, nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pg_tid', sa.String(100), nullable=True),
        sa.Column('pg_response', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    # Add check constraints for plan and status
    op.execute("ALTER TABLE payment_history ADD CONSTRAINT chk_payment_plan CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE'))")
    op.execute("ALTER TABLE payment_history ADD CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED'))")
    
    # Modify quote table - add user_id
    op.add_column('quote', sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='SET NULL'), nullable=True))
    
    # quote.status is already quote_status enum (created manually), no conversion needed
    
    # Create indexes
    op.create_index('idx_quote_user_id', 'quote', ['user_id'])
    op.create_index('idx_quote_user_created', 'quote', ['user_id', 'created_at'])
    op.create_index('idx_template_user_id', 'template', ['user_id'])
    op.create_index('idx_payment_history_user_id', 'payment_history', ['user_id'])
    op.create_index('idx_payment_history_status', 'payment_history', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_payment_history_status', table_name='payment_history')
    op.drop_index('idx_payment_history_user_id', table_name='payment_history')
    op.drop_index('idx_template_user_id', table_name='template')
    op.drop_index('idx_quote_user_created', table_name='quote')
    op.drop_index('idx_quote_user_id', table_name='quote')
    
    # Remove user_id from quote
    op.drop_column('quote', 'user_id')
    
    # Drop tables
    op.drop_table('payment_history')
    op.drop_table('template')
    op.drop_table('company_info')
    op.drop_table('user')
    
    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS payment_status CASCADE')
    op.execute('DROP TYPE IF EXISTS plan_type CASCADE')
    op.execute('DROP TYPE IF EXISTS quote_status CASCADE')