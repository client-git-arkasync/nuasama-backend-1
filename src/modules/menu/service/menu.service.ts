import prisma from '../../../lib/prisma';
import { MenuListQuery } from '../menu';

export class MenuService {
  async getAll(query: MenuListQuery) {
    const { category, search, page, limit } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      stock_status: 'aktif',
    };

    if (category) {
      const lowerCat = category.toLowerCase();
      if (lowerCat === 'cemilan') {
        whereClause.category = 'snack';
      } else {
        whereClause.category = lowerCat;
      }
    }

    if (search) {
      whereClause.name = {
        contains: search,
      };
    }

    const [total, items] = await Promise.all([
      prisma.menuItem.count({ where: whereClause }),
      prisma.menuItem.findMany({
        where: whereClause,
        include: {
          dapur: {
            select: {
              name: true,
              logo_url: true,
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);

    const formattedItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      photoUrl: item.photo_url,
      category: item.category,
      stockStatus: item.stock_status,
      useStock: item.use_stock,
      stockQuantity: item.stock_quantity,
      discountPrice: item.discount_price ? Number(item.discount_price) : null,
      dapurId: item.dapur_id,
      dapurName: item.dapur?.name,
      dapurLogoUrl: item.dapur?.logo_url,
    }));

    return {
      items: formattedItems,
      total,
    };
  }

  async getById(id: string) {
    const item = await prisma.menuItem.findFirst({
      where: {
        id,
        stock_status: 'aktif',
      },
      include: {
        dapur: {
          select: {
            name: true,
            logo_url: true,
          }
        }
      }
    });

    if (!item) {
      return null;
    }

    return {
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        photoUrl: item.photo_url,
        category: item.category,
        stockStatus: item.stock_status,
        useStock: item.use_stock,
        stockQuantity: item.stock_quantity,
        discountPrice: item.discount_price ? Number(item.discount_price) : null,
        dapurId: item.dapur_id,
        dapurName: item.dapur?.name,
        dapurLogoUrl: item.dapur?.logo_url,
      }
    };
  }
}

export const menuService = new MenuService();
