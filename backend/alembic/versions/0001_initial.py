"""Initial migration"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'quote',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('quote_number', sa.String(20), unique=True, nullable=False, index=True),
        sa.Column('status', sa.Enum('DRAFT', 'COMPLETED', 'EXPIRED', name='quote_status', native_enum=False), nullable=False, server_default='DRAFT'),
        sa.Column('customer_info', sa.JSON(), nullable=False),
        sa.Column('supplier_info', sa.JSON(), nullable=True),
        sa.Column('calculation_snapshot', sa.JSON(), nullable=False),
        sa.Column('totals', sa.JSON(), nullable=False),
        sa.Column('watermark_text', sa.String(100), nullable=False, server_default='Powered by 율소프트 | www.yulsoft.kr'),
        sa.Column('design_key', sa.String(20), nullable=False, server_default='classic'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'quote_item',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('quote_id', UUID(as_uuid=True), sa.ForeignKey('quote.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('area', sa.String(50), nullable=False),
        sa.Column('task', sa.String(100), nullable=False),
        sa.Column('days', sa.JSON(), nullable=False),
        sa.Column('qty', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Integer(), nullable=False),
        sa.Column('total_price', sa.Integer(), nullable=False),
        sa.Column('exclude_area', sa.String(100), nullable=True),
        sa.Column('memo', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_index('idx_quote_expires_status', 'quote', ['expires_at', 'status'])
    op.create_index('idx_quote_created_at', 'quote', ['created_at'])
    op.create_index('idx_quote_item_quote_id', 'quote_item', ['quote_id'])


def downgrade() -> None:
    op.drop_index('idx_quote_item_quote_id', table_name='quote_item')
    op.drop_index('idx_quote_created_at', table_name='quote')
    op.drop_index('idx_quote_expires_status', table_name='quote')
    op.drop_table('quote_item')
    op.drop_table('quote')
    op.execute('DROP TYPE IF EXISTS quote_status')