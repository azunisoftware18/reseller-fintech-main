import crypto from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import { tenantMasterPageSectionsTable } from '../models/core/index.js';

class MasterPageSectionService {
  // ---------------- ADD SECTION ----------------
  async addSection(masterPageId, payload) {
    const { sectionType, sectionData } = payload;

    // Find last sort order
    const last = await db
      .select()
      .from(tenantMasterPageSectionsTable)
      .where(eq(tenantMasterPageSectionsTable.masterPageId, masterPageId))
      .orderBy(tenantMasterPageSectionsTable.sortOrder);

    const sortOrder = last.length ? last[last.length - 1].sortOrder + 1 : 1;

    const id = crypto.randomUUID();

    await db.insert(tenantMasterPageSectionsTable).values({
      id,
      masterPageId,
      sectionType,
      sectionData,
      sortOrder,
    });

    return this.findByPage(masterPageId);
  }

  // ---------------- GET ALL SECTIONS ----------------
  async findByPage(masterPageId) {
    return db
      .select()
      .from(tenantMasterPageSectionsTable)
      .where(eq(tenantMasterPageSectionsTable.masterPageId, masterPageId))
      .orderBy(tenantMasterPageSectionsTable.sortOrder);
  }

  // ---------------- UPDATE SECTION ----------------
  async updateSection(id, sectionData) {
    await db
      .update(tenantMasterPageSectionsTable)
      .set({ sectionData })
      .where(eq(tenantMasterPageSectionsTable.id, id));

    return this.findOne(id);
  }

  async findOne(id) {
    const [section] = await db
      .select()
      .from(tenantMasterPageSectionsTable)
      .where(eq(tenantMasterPageSectionsTable.id, id));

    if (!section) throw ApiError.notFound('Section not found');
    return section;
  }

  // ---------------- DELETE SECTION ----------------
  async deleteSection(id) {
    const section = await this.findOne(id);

    await db
      .delete(tenantMasterPageSectionsTable)
      .where(eq(tenantMasterPageSectionsTable.id, id));

    // Shift remaining sections up
    await db
      .update(tenantMasterPageSectionsTable)
      .set({
        sortOrder: tenantMasterPageSectionsTable.sortOrder - 1,
      })
      .where(
        and(
          eq(tenantMasterPageSectionsTable.masterPageId, section.masterPageId),
          gt(tenantMasterPageSectionsTable.sortOrder, section.sortOrder),
        ),
      );
  }

  // ---------------- REORDER SECTION ----------------
  async moveSection(id, newOrder) {
    const section = await this.findOne(id);

    await db
      .update(tenantMasterPageSectionsTable)
      .set({
        sortOrder: tenantMasterPageSectionsTable.sortOrder + 1,
      })
      .where(
        and(
          eq(tenantMasterPageSectionsTable.masterPageId, section.masterPageId),
          eq(tenantMasterPageSectionsTable.sortOrder, newOrder),
        ),
      );

    await db
      .update(tenantMasterPageSectionsTable)
      .set({ sortOrder: newOrder })
      .where(eq(tenantMasterPageSectionsTable.id, id));

    return this.findByPage(section.masterPageId);
  }
}

export default new MasterPageSectionService();
